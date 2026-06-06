import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai'
import { getProfile, updateStreak } from '@/lib/db/profiles'
import { getCheckinByDate, upsertCheckin, updateAiReflection } from '@/lib/db/checkins'
import { buildJournalReflectionPrompt } from '@/lib/prompts'
import { genericApiError, parseCheckinBody } from '@/lib/security'
import { createClient } from '@/utils/supabase/server'
import { calcStreak } from '@/lib/utils'

export const runtime = 'edge'

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

    const parsed = parseCheckinBody(await req.json())
    if (!parsed) {
      return Response.json({ error: 'Invalid check-in data' }, { status: 400 })
    }

    const { checkinDate, ...form } = parsed

    const existing = await getCheckinByDate(supabase, user.id, checkinDate)
    const profile = await getProfile(supabase, user.id)

    const checkin = await upsertCheckin(supabase, {
      userId: user.id,
      checkinDate,
      moodScore: form.moodScore,
      energyLevel: form.energyLevel,
      anxietyLevel: form.anxietyLevel,
      triggers: form.triggers,
      journalEntry: form.journalEntry,
      gratitudeNote: form.gratitudeNote,
      studyHours: form.studyHours,
      sleepHours: form.sleepHours,
    })

    let streakCount = profile?.streakCount ?? 0
    let totalCheckins = profile?.totalCheckins ?? 0

    if (!existing) {
      streakCount = calcStreak(profile?.lastCheckinDate ?? null, streakCount, checkinDate)
      totalCheckins += 1
      await updateStreak(supabase, user.id, streakCount, checkinDate, totalCheckins)
    }

    let aiReflection: string | null = null

    if (profile?.aiEnabled && form.journalEntry.length > 30) {
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
              moodScore: form.moodScore,
              anxietyLevel: form.anxietyLevel,
              energyLevel: form.energyLevel,
              triggers: form.triggers,
              journalEntry: form.journalEntry,
              studyHours: form.studyHours,
              sleepHours: form.sleepHours,
            }),
          },
        ]
        aiReflection = await callAI(messages, { maxTokens: 200 })
        await updateAiReflection(supabase, user.id, checkin.id, aiReflection)
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
    console.error('Checkin save error:', err)
    return Response.json({ error: genericApiError() }, { status: 500 })
  }
}
