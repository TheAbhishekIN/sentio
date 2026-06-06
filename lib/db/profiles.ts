import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExamPhase, ExamType, UserProfile } from '@/lib/types'

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    exam: row.exam as ExamType,
    examDate: (row.exam_date as string) ?? null,
    phase: row.phase as ExamPhase,
    targetCollege: (row.target_college as string) ?? null,
    motivationalAnchor: (row.motivational_anchor as string) ?? null,
    reminderTime: (row.reminder_time as string) ?? null,
    streakCount: row.streak_count as number,
    lastCheckinDate: (row.last_checkin_date as string) ?? null,
    totalCheckins: row.total_checkins as number,
    aiEnabled: row.ai_enabled as boolean,
    onboardingComplete: row.onboarding_complete as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? mapProfile(data) : null
}

export async function upsertProfile(
  supabase: SupabaseClient,
  profile: Partial<UserProfile> & { id: string }
): Promise<UserProfile> {
  const row: Record<string, unknown> = { id: profile.id }
  if (profile.name !== undefined) row.name = profile.name
  if (profile.exam !== undefined) row.exam = profile.exam
  if (profile.examDate !== undefined) row.exam_date = profile.examDate
  if (profile.phase !== undefined) row.phase = profile.phase
  if (profile.targetCollege !== undefined) row.target_college = profile.targetCollege
  if (profile.motivationalAnchor !== undefined) row.motivational_anchor = profile.motivationalAnchor
  if (profile.reminderTime !== undefined) row.reminder_time = profile.reminderTime
  if (profile.streakCount !== undefined) row.streak_count = profile.streakCount
  if (profile.lastCheckinDate !== undefined) row.last_checkin_date = profile.lastCheckinDate
  if (profile.totalCheckins !== undefined) row.total_checkins = profile.totalCheckins
  if (profile.aiEnabled !== undefined) row.ai_enabled = profile.aiEnabled
  if (profile.onboardingComplete !== undefined) row.onboarding_complete = profile.onboardingComplete

  const { data, error } = await supabase.from('profiles').upsert(row).select('*').single()

  if (error) throw error
  return mapProfile(data)
}

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
  streakCount: number,
  lastCheckinDate: string,
  totalCheckins: number
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      streak_count: streakCount,
      last_checkin_date: lastCheckinDate,
      total_checkins: totalCheckins,
    })
    .eq('id', userId)

  if (error) throw error
}

export async function updatePhase(
  supabase: SupabaseClient,
  userId: string,
  phase: ExamPhase
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ phase }).eq('id', userId)
  if (error) throw error
}

export { mapProfile }
