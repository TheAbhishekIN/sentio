import { cookies } from 'next/headers'
import { callAI, type ChatMessage } from '@/lib/ai'
import { getInsightByWeek } from '@/lib/db/insights'
import { getProfile } from '@/lib/db/profiles'
import {
  MAX_INSIGHT_CHAT_USER_MESSAGES,
  type InsightChatMessage,
} from '@/lib/insight-chat'
import { buildInsightChatSystemPrompt } from '@/lib/prompts'
import { genericApiError, sanitizeInsightChatMessages } from '@/lib/security'
import { createClient } from '@/utils/supabase/server'

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

    const body = await req.json()
    const weekOf = typeof body.weekOf === 'string' ? body.weekOf.trim() : ''
    const messages: InsightChatMessage[] = sanitizeInsightChatMessages(body.messages)

    if (!weekOf) {
      return Response.json({ error: 'Missing weekOf' }, { status: 400 })
    }

    const profile = await getProfile(supabase, user.id)
    if (!profile?.aiEnabled) {
      return Response.json({ error: 'AI is disabled in Settings' }, { status: 403 })
    }

    const insight = await getInsightByWeek(supabase, user.id, weekOf)
    if (!insight) {
      return Response.json({ error: 'No insight found for this week' }, { status: 404 })
    }

    const userMessageCount = messages.length
    if (userMessageCount > MAX_INSIGHT_CHAT_USER_MESSAGES) {
      return Response.json(
        { error: `Message limit reached (${MAX_INSIGHT_CHAT_USER_MESSAGES} per week)` },
        { status: 429 }
      )
    }

    const last = messages.at(-1)
    if (!last) {
      return Response.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    if (!last.content.trim()) {
      return Response.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    const aiMessages: ChatMessage[] = [
      {
        role: 'system',
        content: buildInsightChatSystemPrompt({ profile, insight }),
      },
      ...messages.map((m) => ({
        role: 'user' as const,
        content: m.content,
      })),
    ]

    const reply = await callAI(aiMessages, { maxTokens: 256 })

    return Response.json({
      reply,
      userMessagesUsed: userMessageCount,
      userMessagesRemaining: MAX_INSIGHT_CHAT_USER_MESSAGES - userMessageCount,
    })
  } catch (err) {
    console.error('Insight chat error:', err)
    return Response.json({ error: genericApiError() }, { status: 500 })
  }
}
