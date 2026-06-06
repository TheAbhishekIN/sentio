import { cookies } from 'next/headers'
import { callAI, type ChatMessage } from '@/lib/ai'
import { getInsightByWeek } from '@/lib/db/insights'
import { getProfile } from '@/lib/db/profiles'
import {
  countUserMessages,
  MAX_INSIGHT_CHAT_MESSAGE_LENGTH,
  MAX_INSIGHT_CHAT_USER_MESSAGES,
  type InsightChatMessage,
} from '@/lib/insight-chat'
import { buildInsightChatSystemPrompt } from '@/lib/prompts'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

function parseMessages(raw: unknown): InsightChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (m): m is InsightChatMessage =>
      typeof m === 'object' &&
      m !== null &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length <= MAX_INSIGHT_CHAT_MESSAGE_LENGTH
  )
}

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
    const messages = parseMessages(body.messages)

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

    const userMessageCount = countUserMessages(messages)
    if (userMessageCount > MAX_INSIGHT_CHAT_USER_MESSAGES) {
      return Response.json(
        { error: `Message limit reached (${MAX_INSIGHT_CHAT_USER_MESSAGES} per week)` },
        { status: 429 }
      )
    }

    const last = messages.at(-1)
    if (!last || last.role !== 'user') {
      return Response.json({ error: 'Last message must be from user' }, { status: 400 })
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
        role: m.role as 'user' | 'assistant',
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
