import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/coping/save/route'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockSaveCopingSession = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/db/insights', () => ({
  saveCopingSession: (...args: unknown[]) => mockSaveCopingSession(...args),
}))

describe('POST /api/coping/save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockSaveCopingSession.mockResolvedValue(undefined)
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await POST(new Request('http://x', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('saves coping session', async () => {
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({
          toolId: 'breathing',
          durationSecs: 90,
          moodBefore: 2,
          moodAfter: 4,
        }),
      })
    )
    expect(res.status).toBe(200)
    expect(mockSaveCopingSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toolId: 'breathing', durationSecs: 90 })
    )
  })

  it('defaults duration to 0', async () => {
    await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ toolId: 'walk' }),
      })
    )
    expect(mockSaveCopingSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ durationSecs: 0 })
    )
  })

  it('returns 500 on error', async () => {
    mockSaveCopingSession.mockRejectedValue(new Error('db'))
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ toolId: 'walk' }),
      })
    )
    expect(res.status).toBe(500)
  })
})
