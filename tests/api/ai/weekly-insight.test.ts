import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/ai/weekly-insight/route'
import { makeCheckin, makeProfile, jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockCallAI = vi.fn()
const mockUpsertInsight = vi.fn()
const mockGetRecentCheckins = vi.fn()
const mockGetProfile = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/ai', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

vi.mock('@/lib/db/insights', () => ({
  upsertInsight: (...args: unknown[]) => mockUpsertInsight(...args),
}))

vi.mock('@/lib/db/checkins', () => ({
  getRecentCheckins: (...args: unknown[]) => mockGetRecentCheckins(...args),
}))

vi.mock('@/lib/db/profiles', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}))

describe('POST /api/ai/weekly-insight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockGetProfile.mockResolvedValue(makeProfile({ aiEnabled: true }))
    mockGetRecentCheckins.mockResolvedValue([makeCheckin(), makeCheckin({ id: 'c2' })])
    mockCallAI.mockResolvedValue('["Tip one","Tip two","Tip three"]')
    mockUpsertInsight.mockResolvedValue({
      id: 'insight-1',
      recommendations: ['Tip one', 'Tip two', 'Tip three'],
    })
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 403 when AI disabled', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ aiEnabled: false }))
    const res = await POST()
    expect(res.status).toBe(403)
  })

  it('returns 400 when no checkins in database', async () => {
    mockGetRecentCheckins.mockResolvedValue([])
    const res = await POST()
    expect(res.status).toBe(400)
  })

  it('loads checkins from database and saves insight', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await jsonBody<{ recommendations: string[]; burnoutScore: number }>(res)
    expect(body.recommendations).toEqual(['Tip one', 'Tip two', 'Tip three'])
    expect(mockGetRecentCheckins).toHaveBeenCalledWith(expect.anything(), 'user-1', 7)
    expect(mockUpsertInsight).toHaveBeenCalled()
  })

  it('falls back to raw text when JSON parse fails', async () => {
    mockCallAI.mockResolvedValue('Plain text insight without JSON')
    const res = await POST()
    const body = await jsonBody<{ recommendations: string[] }>(res)
    expect(body.recommendations).toEqual(['Plain text insight without JSON'])
  })

  it('falls back to raw text when JSON array is malformed', async () => {
    mockCallAI.mockResolvedValue('Here you go: ["incomplete array')
    const res = await POST()
    const body = await jsonBody<{ recommendations: string[] }>(res)
    expect(body.recommendations).toEqual(['Here you go: ["incomplete array'])
  })

  it('returns 500 when AI fails', async () => {
    mockCallAI.mockRejectedValue(new Error('AI fail'))
    const res = await POST()
    expect(res.status).toBe(500)
    expect((await jsonBody<{ error: string }>(res)).error).toBe('Something went wrong')
  })
})
