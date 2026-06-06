import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai'
import { getProfile, updateStreak } from '@/lib/db/profiles'
import { getCheckinByDate, upsertCheckin, updateAiReflection } from '@/lib/db/checkins'
import { buildJournalReflectionPrompt } from '@/lib/prompts'
import { createClient } from '@/utils/supabase/server'
import { calcStreak, todayISO } from '@/lib/utils'
import type { CheckinFormData } from '@/lib/types'

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

    const body = (await req.json()) as CheckinFormData & { checkinDate?: string }
    const checkinDate = body.checkinDate ?? todayISO()

    const existing = await getCheckinByDate(supabase, user.id, checkinDate)
    const profile = await getProfile(supabase, user.id)

    const checkin = await upsertCheckin(supabase, {
      userId: user.id,
      checkinDate,
      moodScore: body.moodScore,
      energyLevel: body.energyLevel,
      anxietyLevel: body.anxietyLevel,
      triggers: body.triggers,
      journalEntry: body.journalEntry,
      gratitudeNote: body.gratitudeNote,
      studyHours: body.studyHours,
      sleepHours: body.sleepHours,
    })

    let streakCount = profile?.streakCount ?? 0
    let totalCheckins = profile?.totalCheckins ?? 0

    if (!existing) {
      streakCount = calcStreak(profile?.lastCheckinDate ?? null, streakCount, checkinDate)
      totalCheckins += 1
      await updateStreak(supabase, user.id, streakCount, checkinDate, totalCheckins)
    }

    let aiReflection: string | null = null

    if (profile?.aiEnabled && body.journalEntry.length > 30) {
      try {
        const messages = [
          {
            role: 'system' as const,
            content:
              'You are a warm, non-clinical wellness companion for exam-prep students in India.',
          },
          {
            role: 'user' as const,
            content: buildJournalReflectionPrompt({
              name: profile.name,
              exam: profile.exam,
              phase: profile.phase,
              moodScore: body.moodScore,
              anxietyLevel: body.anxietyLevel,
              energyLevel: body.energyLevel,
              triggers: body.triggers,
              journalEntry: body.journalEntry,
              studyHours: body.studyHours,
              sleepHours: body.sleepHours,
            }),
          },
        ]
        aiReflection = await callAI(messages, { maxTokens: 200 })
        await updateAiReflection(supabase, checkin.id, aiReflection)
      } catch {
        aiReflection = null
      }
    }

    return Response.json({
      checkin: { ...checkin, aiReflection: aiReflection ?? checkin.aiReflection },
      streakCount,
      aiReflection,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
