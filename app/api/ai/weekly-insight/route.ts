import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai'
import { calculateBurnoutScore } from '@/lib/burnout'
import { getRecentCheckins } from '@/lib/db/checkins'
import { upsertInsight } from '@/lib/db/insights'
import { getProfile } from '@/lib/db/profiles'
import { buildWeeklyInsightPrompt } from '@/lib/prompts'
import { genericApiError } from '@/lib/security'
import { createClient } from '@/utils/supabase/server'
import { avg, getWeekOf } from '@/lib/utils'
import type { StressTrigger } from '@/lib/types'

export const runtime = 'edge'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(supabase, user.id)
    if (!profile?.aiEnabled) {
      return Response.json({ error: 'AI is disabled in Settings' }, { status: 403 })
    }

    const checkins = await getRecentCheckins(supabase, user.id, 7)

    if (!checkins.length) {
      return Response.json({ error: 'No check-ins found for this week' }, { status: 400 })
    }

    const { score, risk } = calculateBurnoutScore(checkins)

    const messages = [
      {
        role: 'user' as const,
        content: buildWeeklyInsightPrompt({ checkins, burnoutScore: score }),
      },
    ]

    const raw = await callAI(messages, { maxTokens: 512 })

    let recommendations: string[] = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) recommendations = JSON.parse(jsonMatch[0])
      else recommendations = [raw]
    } catch {
      recommendations = [raw]
    }

    const triggerCounts: Record<string, number> = {}
    checkins.forEach((c) =>
      (c.triggers ?? []).forEach((t) => {
        triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
      })
    )
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t as StressTrigger)

    const insight = await upsertInsight(supabase, {
      userId: user.id,
      weekOf: getWeekOf(),
      avgMood: avg(checkins.map((c) => c.moodScore)),
      avgAnxiety: avg(checkins.map((c) => c.anxietyLevel)),
      topTriggers,
      burnoutScore: score,
      burnoutRisk: risk,
      recommendations,
      aiInsightText: recommendations.join(' '),
    })

    return Response.json({ insight, recommendations, burnoutScore: score, burnoutRisk: risk })
  } catch (err) {
    console.error('Weekly insight error:', err)
    return Response.json({ error: genericApiError() }, { status: 500 })
  }
}
