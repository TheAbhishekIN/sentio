'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Spinner } from '@/components/ui/Spinner'
import {
  buildInsightIntro,
  countUserMessages,
  loadChatMessages,
  MAX_INSIGHT_CHAT_MESSAGE_LENGTH,
  MAX_INSIGHT_CHAT_USER_MESSAGES,
  saveChatMessages,
  type InsightChatMessage,
} from '@/lib/insight-chat'
import type { WellnessInsight } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

interface InsightChatViewProps {
  userId: string
  weekOf: string
  insight: WellnessInsight
}

export function InsightChatView({ userId, weekOf, insight }: InsightChatViewProps) {
  const [messages, setMessages] = useState<InsightChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const intro = buildInsightIntro(insight.recommendations)
  const userCount = countUserMessages(messages)
  const atLimit = userCount >= MAX_INSIGHT_CHAT_USER_MESSAGES

  useEffect(() => {
    setMessages(loadChatMessages(userId, weekOf))
    setHydrated(true)
  }, [userId, weekOf])

  useEffect(() => {
    if (hydrated) {
      saveChatMessages(userId, weekOf, messages)
    }
  }, [messages, userId, weekOf, hydrated])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || atLimit) return
    if (text.length > MAX_INSIGHT_CHAT_MESSAGE_LENGTH) {
      showToast(`Keep messages under ${MAX_INSIGHT_CHAT_MESSAGE_LENGTH} characters`, 'error')
      return
    }

    const userMessage: InsightChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setInput('')
    setMessages(nextMessages)
    setSending(true)

    try {
      const res = await fetch('/api/ai/insight-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekOf, messages: nextMessages }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages(messages)
        setInput(text)
        showToast(data.error ?? 'Could not send message', 'error')
        return
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(messages)
      setInput(text)
      showToast('Connection error — try again', 'error')
    } finally {
      setSending(false)
    }
  }, [atLimit, input, messages, sending, showToast, weekOf])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        <ChatBubble role="assistant" content={intro} />

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-ink-subtle">
            <Spinner size="sm" />
            <span>Thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-hairline bg-canvas pt-3">
        <p className="mb-2 text-center text-xs text-ink-subtle">
          {atLimit
            ? 'Message limit reached for this week'
            : `${MAX_INSIGHT_CHAT_USER_MESSAGES - userCount} of ${MAX_INSIGHT_CHAT_USER_MESSAGES} messages left`}
        </p>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={atLimit ? 'Limit reached' : 'Ask about your weekly insight…'}
            disabled={sending || atLimit}
            rows={2}
            maxLength={MAX_INSIGHT_CHAT_MESSAGE_LENGTH}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <LoadingButton
            loading={sending}
            loadingText=""
            disabled={!input.trim() || atLimit}
            onClick={sendMessage}
            className="!h-11 !w-11 shrink-0 !p-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </LoadingButton>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-tertiary">
          Sentio wellness coach only — not a substitute for professional care
        </p>
      </div>
    </div>
  )
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-on-primary'
            : 'border border-hairline bg-surface-2 text-ink-muted'
        )}
      >
        {content}
      </div>
    </div>
  )
}
