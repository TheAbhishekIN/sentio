import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockUpsertProfile = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/db/profiles', () => ({
  upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsertProfile.mockResolvedValue({})
  })

  it('returns 400 when email or password missing', async () => {
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('returns 401 on invalid credentials', async () => {
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
        body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      })
    )
    expect(res.status).toBe(401)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Invalid email or password.')
  })

  it('returns success and syncs profile name', async () => {
    const user = makeUser({ user_metadata: { name: '  Aarav  ' } })
    const supabase = createMockSupabase({ user })
    mockCreateClient.mockReturnValue(supabase)

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      })
    )
    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual({ success: true })
    expect(mockUpsertProfile).toHaveBeenCalledWith(supabase, { id: 'user-1', name: 'Aarav' })
  })

  it('skips profile sync when name missing', async () => {
    const supabase = createMockSupabase({ user: makeUser({ user_metadata: {} }) })
    mockCreateClient.mockReturnValue(supabase)

    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      })
    )
    expect(res.status).toBe(200)
    expect(mockUpsertProfile).not.toHaveBeenCalled()
  })

  it('returns 500 on unexpected error', async () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('boom')
    })
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      })
    )
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('boom')
  })

  it('returns unknown error for non-Error throws', async () => {
    mockCreateClient.mockImplementation(() => {
      throw 'fail'
    })
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      })
    )
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Login failed')
  })
})
