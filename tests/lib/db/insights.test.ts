import { describe, expect, it, vi } from 'vitest'
import {
  getInsightByWeek,
  getRecentInsights,
  mapInsight,
  saveCopingSession,
  upsertInsight,
} from '@/lib/db/insights'
import { createQueryBuilder } from '../../helpers/mockSupabase'

const row = {
  id: 'i1',
  user_id: 'u1',
  week_of: '2026-22',
  generated_at: '2026-06-01T00:00:00Z',
  avg_mood: 3.5,
  avg_anxiety: 2.5,
  top_triggers: ['sleep_issues'],
  burnout_score: 40,
  burnout_risk: 'low',
  ai_insight_text: 'Rest more',
  recommendations: ['Sleep', 'Walk', 'Hydrate'],
}

describe('db/insights', () => {
  it('mapInsight maps defaults for missing fields', () => {
    const insight = mapInsight({ ...row, avg_mood: undefined, top_triggers: undefined, ai_insight_text: undefined })
    expect(insight.avgMood).toBe(0)
    expect(insight.topTriggers).toEqual([])
    expect(insight.aiInsightText).toBeNull()
  })

  it('getInsightByWeek returns insight', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const insight = await getInsightByWeek(supabase as never, 'u1', '2026-22')
    expect(insight?.weekOf).toBe('2026-22')
  })

  it('getRecentInsights returns list', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: [row], error: null })) }
    expect(await getRecentInsights(supabase as never, 'u1', 3)).toHaveLength(1)
  })

  it('upsertInsight returns mapped insight', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const insight = await upsertInsight(supabase as never, {
      userId: 'u1',
      weekOf: '2026-22',
      recommendations: ['a', 'b', 'c'],
    })
    expect(insight.recommendations).toHaveLength(3)
  })

  it('saveCopingSession inserts session', async () => {
    const insert = vi.fn(async () => ({ error: null }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    await saveCopingSession(supabase as never, {
      userId: 'u1',
      toolId: 'breathing',
      durationSecs: 120,
      moodBefore: 2,
      moodAfter: 4,
    })
    expect(insert).toHaveBeenCalled()
  })

  it('throws on error', async () => {
    const supabase = {
      from: vi.fn(() => createQueryBuilder({ data: null, error: new Error('fail') })),
    }
    await expect(getInsightByWeek(supabase as never, 'u1', '2026-22')).rejects.toThrow('fail')
  })

  it('getInsightByWeek returns null when missing', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getInsightByWeek(supabase as never, 'u1', '2026-22')).toBeNull()
  })

  it('getRecentInsights returns empty when data is null', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getRecentInsights(supabase as never, 'u1', 3)).toEqual([])
  })

  it('upsertInsight maps all optional fields', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const insight = await upsertInsight(supabase as never, {
      userId: 'u1',
      weekOf: '2026-22',
      avgMood: 3.5,
      avgAnxiety: 2.5,
      topTriggers: ['sleep_issues'],
      burnoutScore: 40,
      burnoutRisk: 'low',
      aiInsightText: 'Rest more',
      recommendations: ['a', 'b', 'c'],
    })
    expect(insight.avgMood).toBe(3.5)
    expect(insight.aiInsightText).toBe('Rest more')
  })

  it('mapInsight maps defaults for recommendations', () => {
    const insight = mapInsight({ ...row, recommendations: undefined })
    expect(insight.recommendations).toEqual([])
  })

  it('upsertInsight throws on error', async () => {
    const supabase = {
      from: vi.fn(() => createQueryBuilder({ data: null, error: new Error('upsert fail') })),
    }
    await expect(
      upsertInsight(supabase as never, { userId: 'u1', weekOf: '2026-22' })
    ).rejects.toThrow('upsert fail')
  })

  it('saveCopingSession throws on error', async () => {
    const insert = vi.fn(async () => ({ error: new Error('insert fail') }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    await expect(
      saveCopingSession(supabase as never, {
        userId: 'u1',
        toolId: 'breathing',
        durationSecs: 60,
      })
    ).rejects.toThrow('insert fail')
  })
})
