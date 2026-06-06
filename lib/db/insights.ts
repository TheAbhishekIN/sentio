import type { SupabaseClient } from '@supabase/supabase-js'
import type { BurnoutRisk, StressTrigger, WellnessInsight } from '@/lib/types'

function mapInsight(row: Record<string, unknown>): WellnessInsight {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    weekOf: row.week_of as string,
    generatedAt: row.generated_at as string,
    avgMood: Number(row.avg_mood ?? 0),
    avgAnxiety: Number(row.avg_anxiety ?? 0),
    topTriggers: (row.top_triggers as StressTrigger[]) ?? [],
    burnoutScore: row.burnout_score as number,
    burnoutRisk: row.burnout_risk as BurnoutRisk,
    aiInsightText: (row.ai_insight_text as string) ?? null,
    recommendations: (row.recommendations as string[]) ?? [],
  }
}

export async function getInsightByWeek(
  supabase: SupabaseClient,
  userId: string,
  weekOf: string
): Promise<WellnessInsight | null> {
  const { data, error } = await supabase
    .from('wellness_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('week_of', weekOf)
    .maybeSingle()

  if (error) throw error
  return data ? mapInsight(data) : null
}

export async function getRecentInsights(
  supabase: SupabaseClient,
  userId: string,
  n: number
): Promise<WellnessInsight[]> {
  const { data, error } = await supabase
    .from('wellness_insights')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(n)

  if (error) throw error
  return (data ?? []).map(mapInsight)
}

export async function upsertInsight(
  supabase: SupabaseClient,
  insight: Partial<WellnessInsight> & { userId: string; weekOf: string }
): Promise<WellnessInsight> {
  const row: Record<string, unknown> = {
    user_id: insight.userId,
    week_of: insight.weekOf,
  }
  if (insight.avgMood !== undefined) row.avg_mood = insight.avgMood
  if (insight.avgAnxiety !== undefined) row.avg_anxiety = insight.avgAnxiety
  if (insight.topTriggers !== undefined) row.top_triggers = insight.topTriggers
  if (insight.burnoutScore !== undefined) row.burnout_score = insight.burnoutScore
  if (insight.burnoutRisk !== undefined) row.burnout_risk = insight.burnoutRisk
  if (insight.aiInsightText !== undefined) row.ai_insight_text = insight.aiInsightText
  if (insight.recommendations !== undefined) row.recommendations = insight.recommendations

  const { data, error } = await supabase
    .from('wellness_insights')
    .upsert(row, { onConflict: 'user_id,week_of' })
    .select('*')
    .single()

  if (error) throw error
  return mapInsight(data)
}

export { mapInsight }

export async function saveCopingSession(
  supabase: SupabaseClient,
  session: {
    userId: string
    toolId: string
    durationSecs: number
    moodBefore?: number
    moodAfter?: number
  }
): Promise<void> {
  const { error } = await supabase.from('coping_sessions').insert({
    user_id: session.userId,
    tool_id: session.toolId,
    duration_secs: session.durationSecs,
    mood_before: session.moodBefore,
    mood_after: session.moodAfter,
  })

  if (error) throw error
}
