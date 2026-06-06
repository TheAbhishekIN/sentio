import type { SupabaseClient } from '@supabase/supabase-js'
import type { MoodCheckin, StressTrigger } from '@/lib/types'

function mapCheckin(row: Record<string, unknown>): MoodCheckin {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    checkinDate: row.checkin_date as string,
    createdAt: row.created_at as string,
    moodScore: row.mood_score as MoodCheckin['moodScore'],
    energyLevel: row.energy_level as MoodCheckin['energyLevel'],
    anxietyLevel: row.anxiety_level as MoodCheckin['anxietyLevel'],
    triggers: (row.triggers as StressTrigger[]) ?? [],
    journalEntry: row.journal_entry as string,
    gratitudeNote: (row.gratitude_note as string) ?? null,
    studyHours: Number(row.study_hours),
    sleepHours: Number(row.sleep_hours),
    copingUsed: (row.coping_used as string[]) ?? [],
    aiReflection: (row.ai_reflection as string) ?? null,
  }
}

function toRow(checkin: Partial<MoodCheckin> & { userId: string; checkinDate: string }) {
  const row: Record<string, unknown> = {
    user_id: checkin.userId,
    checkin_date: checkin.checkinDate,
  }
  if (checkin.moodScore !== undefined) row.mood_score = checkin.moodScore
  if (checkin.energyLevel !== undefined) row.energy_level = checkin.energyLevel
  if (checkin.anxietyLevel !== undefined) row.anxiety_level = checkin.anxietyLevel
  if (checkin.triggers !== undefined) row.triggers = checkin.triggers
  if (checkin.journalEntry !== undefined) row.journal_entry = checkin.journalEntry
  if (checkin.gratitudeNote !== undefined) row.gratitude_note = checkin.gratitudeNote
  if (checkin.studyHours !== undefined) row.study_hours = checkin.studyHours
  if (checkin.sleepHours !== undefined) row.sleep_hours = checkin.sleepHours
  if (checkin.copingUsed !== undefined) row.coping_used = checkin.copingUsed
  if (checkin.aiReflection !== undefined) row.ai_reflection = checkin.aiReflection
  return row
}

export async function getCheckinByDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<MoodCheckin | null> {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', date)
    .maybeSingle()

  if (error) throw error
  return data ? mapCheckin(data) : null
}

export async function getRecentCheckins(
  supabase: SupabaseClient,
  userId: string,
  n: number
): Promise<MoodCheckin[]> {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(n)

  if (error) throw error
  return (data ?? []).map(mapCheckin)
}

export async function getCheckinsInRange(
  supabase: SupabaseClient,
  userId: string,
  from: string,
  to: string
): Promise<MoodCheckin[]> {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('checkin_date', from)
    .lte('checkin_date', to)
    .order('checkin_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapCheckin)
}

export async function getAllCheckins(
  supabase: SupabaseClient,
  userId: string
): Promise<MoodCheckin[]> {
  const { data, error } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapCheckin)
}

export async function upsertCheckin(
  supabase: SupabaseClient,
  checkin: Partial<MoodCheckin> & { userId: string; checkinDate: string }
): Promise<MoodCheckin> {
  const row = toRow(checkin)
  const { data, error } = await supabase
    .from('mood_checkins')
    .upsert(row, { onConflict: 'user_id,checkin_date' })
    .select('*')
    .single()

  if (error) throw error
  return mapCheckin(data)
}

export async function updateAiReflection(
  supabase: SupabaseClient,
  userId: string,
  checkinId: string,
  reflection: string
): Promise<void> {
  const { error } = await supabase
    .from('mood_checkins')
    .update({ ai_reflection: reflection })
    .eq('id', checkinId)
    .eq('user_id', userId)

  if (error) throw error
}

export { mapCheckin }
