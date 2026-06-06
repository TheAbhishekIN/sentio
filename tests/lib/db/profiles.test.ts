import { describe, expect, it, vi } from 'vitest'
import {
  getProfile,
  mapProfile,
  updatePhase,
  updateStreak,
  upsertProfile,
} from '@/lib/db/profiles'
import { createQueryBuilder } from '../../helpers/mockSupabase'

const row = {
  id: 'u1',
  name: 'Aarav',
  exam: 'JEE',
  exam_date: '2026-08-01',
  phase: 'intensive',
  target_college: null,
  motivational_anchor: null,
  reminder_time: null,
  streak_count: 3,
  last_checkin_date: '2026-06-05',
  total_checkins: 8,
  ai_enabled: true,
  onboarding_complete: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
}

describe('db/profiles', () => {
  it('mapProfile maps nullable fields', () => {
    const profile = mapProfile(row)
    expect(profile.name).toBe('Aarav')
    expect(profile.aiEnabled).toBe(true)
  })

  it('getProfile returns profile', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    expect(await getProfile(supabase as never, 'u1')).toMatchObject({ id: 'u1' })
  })

  it('getProfile returns null when missing', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: null, error: null })) }
    expect(await getProfile(supabase as never, 'u1')).toBeNull()
  })

  it('upsertProfile returns profile', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const profile = await upsertProfile(supabase as never, { id: 'u1', name: 'Aarav' })
    expect(profile.name).toBe('Aarav')
  })

  it('updateStreak updates profile', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await updateStreak(supabase as never, 'u1', 4, '2026-06-06', 9)
    expect(update).toHaveBeenCalled()
  })

  it('updatePhase updates profile', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await updatePhase(supabase as never, 'u1', 'exam_week')
    expect(update).toHaveBeenCalledWith({ phase: 'exam_week' })
  })

  it('throws on error', async () => {
    const supabase = {
      from: vi.fn(() => createQueryBuilder({ data: null, error: new Error('db') })),
    }
    await expect(getProfile(supabase as never, 'u1')).rejects.toThrow('db')
  })

  it('mapProfile maps nullable fields', () => {
    const profile = mapProfile({
      ...row,
      exam_date: null,
      target_college: 'IIT',
      motivational_anchor: 'Parents',
      reminder_time: '09:00',
      last_checkin_date: null,
    })
    expect(profile.examDate).toBeNull()
    expect(profile.targetCollege).toBe('IIT')
    expect(profile.reminderTime).toBe('09:00')
    expect(profile.lastCheckinDate).toBeNull()
  })

  it('upsertProfile maps all optional fields', async () => {
    const supabase = { from: vi.fn(() => createQueryBuilder({ data: row, error: null })) }
    const profile = await upsertProfile(supabase as never, {
      id: 'u1',
      name: 'Aarav',
      exam: 'JEE',
      examDate: '2026-08-01',
      phase: 'intensive',
      targetCollege: 'IIT',
      motivationalAnchor: 'Family',
      reminderTime: '08:00',
      streakCount: 5,
      lastCheckinDate: '2026-06-06',
      totalCheckins: 10,
      aiEnabled: true,
      onboardingComplete: true,
    })
    expect(profile.name).toBe('Aarav')
  })

  it('updateStreak throws on error', async () => {
    const eq = vi.fn(async () => ({ error: new Error('streak fail') }))
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await expect(updateStreak(supabase as never, 'u1', 1, '2026-06-06', 1)).rejects.toThrow(
      'streak fail'
    )
  })

  it('updatePhase throws on error', async () => {
    const eq = vi.fn(async () => ({ error: new Error('phase fail') }))
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) }
    await expect(updatePhase(supabase as never, 'u1', 'exam_week')).rejects.toThrow('phase fail')
  })
})
