import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/ai/weekly-insight/route'
import { makeCheckin, jsonBody } from '../../fixtures'
import { createMockSupabase, makeUser } from '../../helpers/mockSupabase'

const mockCreateClient = vi.fn()
const mockCallAI = vi.fn()
const mockUpsertInsight = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/ai', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

vi.mock('@/lib/db/insights', () => ({
  upsertInsight: (...args: unknown[]) => mockUpsertInsight(...args),
}))

describe('POST /api/ai/weekly-insight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(createMockSupabase({ user: makeUser() }))
    mockCallAI.mockResolvedValue('["Tip one","Tip two","Tip three"]')
    mockUpsertInsight.mockResolvedValue({ id: 'insight-1', recommendations: ['Tip one', 'Tip two', 'Tip three'] })
  })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValue(createMockSupabase({ user: null }))
    const res = await POST(new Request('http://x', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no checkins', async () => {
    const res = await POST(
      new Request('http://x', { method: 'POST', body: JSON.stringify({ checkins: [] }) })
    )
    expect(res.status).toBe(400)
  })

  it('parses JSON recommendations and saves insight', async () => {
    const checkins = [
      makeCheckin({ triggers: ['mock_score', 'sleep_issues'] }),
      makeCheckin({ id: 'c2', triggers: ['mock_score'] }),
    ]
    const res = await POST(
      new Request('http://x', { method: 'POST', body: JSON.stringify({ checkins }) })
    )
    expect(res.status).toBe(200)
    const body = await jsonBody<{ recommendations: string[]; burnoutScore: number }>(res)
    expect(body.recommendations).toEqual(['Tip one', 'Tip two', 'Tip three'])
    expect(mockUpsertInsight).toHaveBeenCalled()
  })

  it('falls back to raw text when JSON parse fails', async () => {
    mockCallAI.mockResolvedValue('Plain text insight without JSON')
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ checkins: [makeCheckin()] }),
      })
    )
    const body = await jsonBody<{ recommendations: string[] }>(res)
    expect(body.recommendations).toEqual(['Plain text insight without JSON'])
  })

  it('falls back to raw text when JSON array is malformed', async () => {
    mockCallAI.mockResolvedValue('Here you go: ["incomplete array')
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ checkins: [makeCheckin()] }),
      })
    )
    const body = await jsonBody<{ recommendations: string[] }>(res)
    expect(body.recommendations).toEqual(['Here you go: ["incomplete array'])
  })

  it('handles checkins without triggers', async () => {
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ checkins: [makeCheckin({ triggers: [] })] }),
      })
    )
    expect(res.status).toBe(200)
  })

  it('returns 500 when AI fails', async () => {
    mockCallAI.mockRejectedValue(new Error('AI fail'))
    const res = await POST(
      new Request('http://x', {
        method: 'POST',
        body: JSON.stringify({ checkins: [makeCheckin()] }),
      })
    )
    expect(res.status).toBe(500)
  })
})
