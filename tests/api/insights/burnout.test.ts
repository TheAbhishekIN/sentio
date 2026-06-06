import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/insights/burnout/route'
import { makeCheckin, jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockGetRecentCheckins = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/db/checkins', () => ({
  getRecentCheckins: (...args: unknown[]) => mockGetRecentCheckins(...args),
}))

describe('GET /api/insights/burnout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockGetRecentCheckins.mockResolvedValue([makeCheckin()])
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns burnout score payload', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await jsonBody<{ score: number; risk: string; factors: string[] }>(res)
    expect(body).toHaveProperty('score')
    expect(body).toHaveProperty('risk')
    expect(Array.isArray(body.factors)).toBe(true)
  })

  it('returns 500 on error', async () => {
    mockGetRecentCheckins.mockRejectedValue(new Error('db'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
