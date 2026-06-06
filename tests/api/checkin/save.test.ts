import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/checkin/save/route'
import { makeCheckin, makeProfile, jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockGetCheckinByDate = vi.fn()
const mockGetProfile = vi.fn()
const mockUpsertCheckin = vi.fn()
const mockUpdateStreak = vi.fn()
const mockCallAI = vi.fn()
const mockUpdateAiReflection = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/db/checkins', () => ({
  getCheckinByDate: (...args: unknown[]) => mockGetCheckinByDate(...args),
  upsertCheckin: (...args: unknown[]) => mockUpsertCheckin(...args),
  updateAiReflection: (...args: unknown[]) => mockUpdateAiReflection(...args),
}))

vi.mock('@/lib/db/profiles', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateStreak: (...args: unknown[]) => mockUpdateStreak(...args),
}))

vi.mock('@/lib/ai', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

const body = {
  moodScore: 3 as const,
  energyLevel: 3 as const,
  anxietyLevel: 3 as const,
  triggers: ['self_doubt' as const],
  journalEntry: 'This is a long enough journal entry for AI reflection generation.',
  studyHours: 6,
  sleepHours: 7,
}

describe('POST /api/checkin/save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00'))
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockGetCheckinByDate.mockResolvedValue(null)
    mockGetProfile.mockResolvedValue(makeProfile({ streakCount: 2, totalCheckins: 5, lastCheckinDate: '2026-06-05' }))
    mockUpsertCheckin.mockResolvedValue(makeCheckin({ id: 'saved-1' }))
    mockUpdateStreak.mockResolvedValue(undefined)
    mockCallAI.mockResolvedValue('Great reflection')
    mockUpdateAiReflection.mockResolvedValue(undefined)
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(401)
  })

  it('saves new checkin and increments streak', async () => {
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const data = await jsonBody<{ streakCount: number; aiReflection: string }>(res)
    expect(data.streakCount).toBe(3)
    expect(data.aiReflection).toBe('Great reflection')
    expect(mockUpdateStreak).toHaveBeenCalled()
  })

  it('skips streak update when editing existing checkin', async () => {
    mockGetCheckinByDate.mockResolvedValue(makeCheckin())
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    expect(mockUpdateStreak).not.toHaveBeenCalled()
    const data = await jsonBody<{ streakCount: number }>(res)
    expect(data.streakCount).toBe(2)
  })

  it('skips AI when disabled or journal too short', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ aiEnabled: false }))
    let res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ ...body, journalEntry: 'short' }),
      })
    )
    let data = await jsonBody<{ aiReflection: null }>(res)
    expect(data.aiReflection).toBeNull()
    expect(mockCallAI).not.toHaveBeenCalled()

    mockGetProfile.mockResolvedValue(makeProfile({ aiEnabled: true }))
    res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ ...body, journalEntry: 'too short' }),
      })
    )
    data = await jsonBody(res)
    expect(data.aiReflection).toBeNull()
  })

  it('continues when AI reflection fails', async () => {
    mockCallAI.mockRejectedValue(new Error('AI down'))
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const data = await jsonBody<{ aiReflection: null }>(res)
    expect(data.aiReflection).toBeNull()
  })

  it('uses provided checkinDate', async () => {
    await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ ...body, checkinDate: '2026-06-04' }),
      })
    )
    expect(mockUpsertCheckin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ checkinDate: '2026-06-04' })
    )
  })

  it('handles missing profile with default streak values', async () => {
    mockGetProfile.mockResolvedValue(null)
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const data = await jsonBody<{ streakCount: number }>(res)
    expect(data.streakCount).toBe(1)
  })

  it('returns 500 on unexpected error', async () => {
    mockUpsertCheckin.mockRejectedValue(new Error('db'))
    const res = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }))
    expect(res.status).toBe(500)
    vi.useRealTimers()
  })
})
