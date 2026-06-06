import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai'
import { updateAiReflection } from '@/lib/db/checkins'
import { buildJournalReflectionPrompt } from '@/lib/prompts'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { checkinId, ...promptParams } = body

    const messages = [
      {
        role: 'system' as const,
        content:
          'You are a warm, non-clinical wellness companion for exam-prep students in India.',
      },
      {
        role: 'user' as const,
        content: buildJournalReflectionPrompt(promptParams),
      },
    ]

    const reflection = await callAI(messages, { maxTokens: 200 })

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    await updateAiReflection(supabase, checkinId, reflection)

    return Response.json({ reflection })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('AI reflect error:', message)
    return Response.json({ reflection: null, error: message }, { status: 200 })
  }
}
