import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai'
import { calculateBurnoutScore } from '@/lib/burnout'
import { upsertInsight } from '@/lib/db/insights'
import { buildWeeklyInsightPrompt } from '@/lib/prompts'
import { createClient } from '@/utils/supabase/server'
import { avg, getWeekOf } from '@/lib/utils'
import type { MoodCheckin, StressTrigger } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkins } = (await req.json()) as { checkins: MoodCheckin[] }

    if (!checkins?.length) {
      return Response.json({ error: 'No check-ins provided' }, { status: 400 })
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
