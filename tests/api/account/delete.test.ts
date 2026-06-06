import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/account/delete/route'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockCreateServiceClient = vi.fn()
const originalEnv = process.env

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  createServiceClient: (...args: unknown[]) => mockCreateServiceClient(...args),
}))

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, SUPABASE_SERVICE_ROLE_KEY: 'service-key' }
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockCreateServiceClient.mockReturnValue(
      createMockSupabase({ auth: { admin: { deleteUser: { error: null } } } })
    )
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 503 without service role key', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const res = await POST()
    expect(res.status).toBe(503)
  })

  it('deletes user and signs out', async () => {
    const client = createMockSupabase({ user: makeUser() })
    const admin = createMockSupabase({ auth: { admin: { deleteUser: { error: null } } } })
    mockCreateClient.mockReturnValue(client)
    mockCreateServiceClient.mockReturnValue(admin)

    const res = await POST()
    expect(res.status).toBe(200)
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith('user-1')
    expect(client.auth.signOut).toHaveBeenCalled()
  })

  it('returns 500 when delete fails', async () => {
    mockCreateServiceClient.mockReturnValue(
      createMockSupabase({
        auth: { admin: { deleteUser: { error: new Error('delete fail') } } },
      })
    )
    const res = await POST()
    expect(res.status).toBe(500)
  })
})
