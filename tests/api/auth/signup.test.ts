import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/signup/route'
import { jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockCreateServiceClient = vi.fn()
const mockUpsertProfile = vi.fn()
const originalEnv = process.env

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  createServiceClient: (...args: unknown[]) => mockCreateServiceClient(...args),
}))

vi.mock('@/lib/db/profiles', () => ({
  upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'pub-key',
      SIGNUP_FUNCTION_SECRET: 'signup-secret',
    }
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    mockUpsertProfile.mockResolvedValue({})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('returns 400 when fields missing', async () => {
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password too short', async () => {
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'short', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(400)
    expect((await jsonBody<{ error: string }>(res)).error).toContain('8 characters')
  })

  it('returns 400 when name blank', async () => {
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: '   ' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('creates user via edge function when no service role key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ userId: 'edge-user' }), { status: 200 })
      )
    )
    const supabase = createMockSupabase({ user: makeUser({ id: 'edge-user' }) })
    mockCreateClient.mockReturnValue(supabase)

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/auth-signup',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('returns edge function error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: 'Email already in use. Try logging in.' }), {
          status: 409,
        })
      )
    )
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(409)
  })

  it('returns 500 when edge function missing userId', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })))
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(500)
  })

  it('returns 500 when supabase env missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Server configuration error')
  })

  it('uses admin createUser when service role key set', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const admin = createMockSupabase({
      auth: {
        admin: {
          createUser: { data: { user: makeUser({ id: 'admin-user' }) }, error: null },
        },
      },
    })
    mockCreateServiceClient.mockReturnValue(admin)
    const supabase = createMockSupabase({ user: makeUser({ id: 'admin-user' }) })
    mockCreateClient.mockReturnValue(supabase)

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(200)
    expect(admin.auth.admin.createUser).toHaveBeenCalled()
  })

  it('returns 409 when admin reports email already exists', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const admin = createMockSupabase({
      auth: {
        admin: {
          createUser: {
            data: { user: null },
            error: { message: 'User already registered' },
          },
        },
      },
    })
    mockCreateServiceClient.mockReturnValue(admin)
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(409)
    expect((await jsonBody<{ error: string }>(res)).error).toContain('already in use')
  })

  it('returns 400 when admin createUser fails for other reasons', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const admin = createMockSupabase({
      auth: {
        admin: {
          createUser: {
            data: { user: null },
            error: { message: 'Password should be at least 6 characters' },
          },
        },
      },
    })
    mockCreateServiceClient.mockReturnValue(admin)
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'x', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 when admin createUser returns no user', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const admin = createMockSupabase({
      auth: {
        admin: {
          createUser: { data: { user: null }, error: null },
        },
      },
    })
    mockCreateServiceClient.mockReturnValue(admin)
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(500)
  })

  it('returns 500 on unexpected signup error', async () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('boom')
    })

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Signup failed')
  })

  it('returns 401 when sign-in fails after create', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ userId: 'edge-user' }), { status: 200 }))
    )
    const supabase = createMockSupabase({
      auth: {
        signInWithPassword: {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        },
      },
    })
    mockCreateClient.mockReturnValue(supabase)

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(401)
    expect(mockUpsertProfile).not.toHaveBeenCalled()
  })

  it('signs in before upserting profile', async () => {
    const order: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ userId: 'edge-user' }), { status: 200 }))
    )
    const supabase = createMockSupabase({ user: makeUser({ id: 'edge-user' }) })
    supabase.auth.signInWithPassword = vi.fn(async () => {
      order.push('signIn')
      return { data: { user: makeUser({ id: 'edge-user' }), session: {} }, error: null }
    })
    mockCreateClient.mockReturnValue(supabase)
    mockUpsertProfile.mockImplementation(async () => {
      order.push('upsert')
      return {}
    })

    await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(order).toEqual(['signIn', 'upsert'])
  })

  it('returns edge function error with default message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 503 }))
    )
    mockCreateClient.mockReturnValue(createMockSupabase({}))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(503)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Could not create account')
  })

  it('returns generic signup failed for non-Error throws', async () => {
    mockCreateClient.mockImplementation(() => {
      throw 'unexpected'
    })

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Signup failed')
  })

  it('succeeds when upsert fails after sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ userId: 'edge-user' }), { status: 200 }))
    )
    const supabase = createMockSupabase({ user: makeUser({ id: 'edge-user' }) })
    mockCreateClient.mockReturnValue(supabase)
    mockUpsertProfile.mockRejectedValue(new Error('RLS violation'))

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret12', name: 'Aarav' }),
      })
    )
    expect(res.status).toBe(200)
  })
})
