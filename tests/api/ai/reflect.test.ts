import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/ai/reflect/route'
import { jsonBody } from '../../fixtures'

const mockCreateClient = vi.fn()
const mockCallAI = vi.fn()
const mockUpdateAiReflection = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/ai', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

vi.mock('@/lib/db/checkins', () => ({
  updateAiReflection: (...args: unknown[]) => mockUpdateAiReflection(...args),
}))

describe('POST /api/ai/reflect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue({})
    mockCallAI.mockResolvedValue('You showed resilience today.')
    mockUpdateAiReflection.mockResolvedValue(undefined)
  })

  it('returns reflection and updates checkin', async () => {
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({
          checkinId: 'c1',
          name: 'Aarav',
          exam: 'JEE',
          phase: 'intensive',
          moodScore: 3,
          anxietyLevel: 3,
          energyLevel: 3,
          triggers: [],
          journalEntry: 'Long enough journal entry for reflection.',
          studyHours: 6,
          sleepHours: 7,
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await jsonBody<{ reflection: string }>(res)
    expect(body.reflection).toContain('resilience')
    expect(mockUpdateAiReflection).toHaveBeenCalledWith({}, 'c1', 'You showed resilience today.')
  })

  it('returns null reflection on error without 500', async () => {
    mockCallAI.mockRejectedValue(new Error('fail'))
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({
          checkinId: 'c1',
          name: 'A',
          exam: 'NEET',
          phase: 'preparation',
          moodScore: 2,
          anxietyLevel: 4,
          energyLevel: 2,
          triggers: ['mock_score'],
          journalEntry: 'Bad mock today but trying again.',
          studyHours: 8,
          sleepHours: 5,
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await jsonBody<{ reflection: null; error: string }>(res)
    expect(body.reflection).toBeNull()
    expect(body.error).toBe('fail')
  })

  it('returns unknown error message for non-Error throws', async () => {
    mockCallAI.mockRejectedValue('network down')
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({
          checkinId: 'c1',
          name: 'A',
          exam: 'NEET',
          phase: 'preparation',
          moodScore: 3,
          anxietyLevel: 3,
          energyLevel: 3,
          triggers: [],
          journalEntry: 'Okay day.',
          studyHours: 4,
          sleepHours: 7,
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await jsonBody<{ reflection: null; error: string }>(res)
    expect(body.reflection).toBeNull()
    expect(body.error).toBe('Unknown error')
  })
})
