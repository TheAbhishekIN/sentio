import { describe, expect, it, vi } from 'vitest'
import {
  getAllCheckins,
  getCheckinByDate,
  getCheckinsInRange,
  getRecentCheckins,
  mapCheckin,
  updateAiReflection,
  upsertCheckin,
} from '@/lib/db/checkins'
import { createQueryBuilder } from '../../helpers/mockSupabase'

const row = {
  id: 'c1',
  user_id: 'u1',
  checkin_date: '2026-06-01',
  created_at: '2026-06-01T00:00:00Z',
  mood_score: 4,
  energy_level: 3,
  anxiety_level: 2,
  triggers: ['mock_score'],
  journal_entry: 'Good day',
  gratitude_note: null,
  study_hours: 6,
  sleep_hours: 7,
  coping_used: [],
  ai_reflection: null,
}

describe('db/checkins', () => {
  it('mapCheckin maps snake_case row', () => {
    const checkin = mapCheckin(row)
    expect(checkin.userId).toBe('u1')
    expect(checkin.moodScore).toBe(4)
    expect(checkin.triggers).toEqual(['mock_score'])
  })

  it('getCheckinByDate returns mapped checkin', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const result = await getCheckinByDate(supabase as never, 'u1', '2026-06-01')
    expect(result?.id).toBe('c1')
  })

  it('getCheckinByDate returns null when missing', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getCheckinByDate(supabase as never, 'u1', '2026-06-01')).toBeNull()
  })

  it('getRecentCheckins maps list', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: [row], error: null })) }
    const result = await getRecentCheckins(supabase as never, 'u1', 7)
    expect(result).toHaveLength(1)
  })

  it('getCheckinsInRange maps list', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: [row], error: null })) }
    const result = await getCheckinsInRange(supabase as never, 'u1', '2026-06-01', '2026-06-07')
    expect(result[0].checkinDate).toBe('2026-06-01')
  })

  it('getAllCheckins maps list', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: [row], error: null })) }
    expect(await getAllCheckins(supabase as never, 'u1')).toHaveLength(1)
  })

  it('upsertCheckin returns mapped row', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const result = await upsertCheckin(supabase as never, {
      userId: 'u1',
      checkinDate: '2026-06-01',
      moodScore: 4,
      energyLevel: 3,
      anxietyLevel: 2,
      triggers: ['mock_score'],
      journalEntry: 'Good day',
      studyHours: 6,
      sleepHours: 7,
    })
    expect(result.id).toBe('c1')
  })

  it('updateAiReflection updates row scoped to user', async () => {
    const eq = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await updateAiReflection(supabase as never, 'u1', 'c1', 'Nice reflection')
    expect(update).toHaveBeenCalledWith({ ai_reflection: 'Nice reflection' })
  })

  it('throws on supabase error', async () => {
    const supabase = {
      from: vi.fn(() => createQueryBuilder({ data: null, error: new Error('db fail') })),
    }
    await expect(getCheckinByDate(supabase as never, 'u1', '2026-06-01')).rejects.toThrow('db fail')
  })

  it('mapCheckin applies defaults for optional fields', () => {
    const checkin = mapCheckin({
      ...row,
      triggers: undefined,
      gratitude_note: undefined,
      coping_used: undefined,
      ai_reflection: undefined,
    })
    expect(checkin.triggers).toEqual([])
    expect(checkin.gratitudeNote).toBeNull()
    expect(checkin.copingUsed).toEqual([])
    expect(checkin.aiReflection).toBeNull()
  })

  it('getRecentCheckins returns empty array when data is null', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getRecentCheckins(supabase as never, 'u1', 7)).toEqual([])
  })

  it('upsertCheckin maps all optional fields', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const result = await upsertCheckin(supabase as never, {
      userId: 'u1',
      checkinDate: '2026-06-01',
      moodScore: 4,
      energyLevel: 3,
      anxietyLevel: 2,
      triggers: ['mock_score'],
      journalEntry: 'Good day',
      gratitudeNote: 'Family',
      studyHours: 6,
      sleepHours: 7,
      copingUsed: ['breathing'],
      aiReflection: 'Nice work',
    })
    expect(result.journalEntry).toBe('Good day')
  })

  it('getCheckinsInRange returns empty when data is null', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getCheckinsInRange(supabase as never, 'u1', '2026-06-01', '2026-06-07')).toEqual([])
  })

  it('getAllCheckins returns empty when data is null', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getAllCheckins(supabase as never, 'u1')).toEqual([])
  })

  it('upsertCheckin with minimal fields', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const result = await upsertCheckin(supabase as never, {
      userId: 'u1',
      checkinDate: '2026-06-01',
    })
    expect(result.id).toBe('c1')
  })

  it('updateAiReflection throws on error', async () => {
    const eq2 = vi.fn(async () => ({ error: new Error('update fail') }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const update = vi.fn(() => ({ eq: eq1 }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await expect(updateAiReflection(supabase as never, 'u1', 'c1', 'text')).rejects.toThrow('update fail')
  })
})
