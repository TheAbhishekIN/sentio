export const MAX_INSIGHT_CHAT_USER_MESSAGES = 10

export const MAX_INSIGHT_CHAT_MESSAGE_LENGTH = 500

export interface InsightChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function chatStorageKey(userId: string, weekOf: string): string {
  return `sentio-insight-chat-${userId}-${weekOf}`
}

export function loadChatMessages(userId: string, weekOf: string): InsightChatMessage[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(chatStorageKey(userId, weekOf))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is InsightChatMessage =>
        typeof m === 'object' &&
        m !== null &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
  } catch {
    return []
  }
}

export function saveChatMessages(
  userId: string,
  weekOf: string,
  messages: InsightChatMessage[]
): void {
  sessionStorage.setItem(chatStorageKey(userId, weekOf), JSON.stringify(messages))
}

export function countUserMessages(messages: InsightChatMessage[]): number {
  return messages.filter((m) => m.role === 'user').length
}

export function buildInsightIntro(recommendations: string[]): string {
  const list = recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')
  return `Here are your personalised recommendations for this week:\n\n${list}\n\nAsk me anything about these insights — stress, sleep, study balance, or your check-in patterns. You have up to ${MAX_INSIGHT_CHAT_USER_MESSAGES} messages this week.`
}
