import { ALL_TRIGGERS, TOOLKIT_TOOLS } from '@/lib/constants'
import type { CheckinFormData, StressTrigger } from '@/lib/types'
import { recentDaysISO, todayISO } from '@/lib/utils'

const SCORE_VALUES = [1, 2, 3, 4, 5] as const
const MAX_JOURNAL_LENGTH = 5000
const MAX_GRATITUDE_LENGTH = 500
const ALLOWED_CHECKIN_DATES = () => new Set(recentDaysISO(4))

export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return '/dashboard'
  const path = next.trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('\\')) {
    return '/dashboard'
  }
  return path
}

export function genericApiError(fallback = 'Something went wrong'): string {
  return fallback
}

export function parseScore(value: unknown): 1 | 2 | 3 | 4 | 5 | null {
  const n = Number(value)
  return SCORE_VALUES.includes(n as (typeof SCORE_VALUES)[number]) ? (n as 1 | 2 | 3 | 4 | 5) : null
}

export function parseTriggers(value: unknown): StressTrigger[] | null {
  if (!Array.isArray(value)) return null
  const triggers = value.filter(
    (t): t is StressTrigger => typeof t === 'string' && ALL_TRIGGERS.includes(t as StressTrigger)
  )
  return triggers.length === value.length ? triggers : null
}

export function parseCheckinDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return todayISO()
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }
  return ALLOWED_CHECKIN_DATES().has(value) ? value : null
}

export function parseCheckinBody(body: unknown): (CheckinFormData & { checkinDate: string }) | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const moodScore = parseScore(b.moodScore)
  const energyLevel = parseScore(b.energyLevel)
  const anxietyLevel = parseScore(b.anxietyLevel)
  const triggers = parseTriggers(b.triggers)
  const checkinDate = parseCheckinDate(b.checkinDate)

  if (!moodScore || !energyLevel || !anxietyLevel || !triggers || !checkinDate) return null

  const journalEntry = typeof b.journalEntry === 'string' ? b.journalEntry.slice(0, MAX_JOURNAL_LENGTH) : ''
  const gratitudeNote =
    typeof b.gratitudeNote === 'string' ? b.gratitudeNote.slice(0, MAX_GRATITUDE_LENGTH) : undefined

  const studyHours = Math.min(24, Math.max(0, Number(b.studyHours) || 0))
  const sleepHours = Math.min(24, Math.max(0, Number(b.sleepHours) || 0))

  return {
    moodScore,
    energyLevel,
    anxietyLevel,
    triggers,
    journalEntry,
    gratitudeNote,
    studyHours,
    sleepHours,
    checkinDate,
  }
}

const TOOL_IDS = new Set(TOOLKIT_TOOLS.map((t) => t.id))

export function parseCopingSessionBody(body: unknown): {
  toolId: string
  durationSecs: number
  moodBefore?: number
  moodAfter?: number
} | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const toolId = typeof b.toolId === 'string' ? b.toolId : ''
  if (!TOOL_IDS.has(toolId as (typeof TOOLKIT_TOOLS)[number]['id'])) return null

  const durationSecs = Math.min(7200, Math.max(0, Math.floor(Number(b.durationSecs) || 0)))
  const moodBefore = b.moodBefore !== undefined ? parseScore(b.moodBefore) : undefined
  const moodAfter = b.moodAfter !== undefined ? parseScore(b.moodAfter) : undefined

  if (b.moodBefore !== undefined && moodBefore === null) return null
  if (b.moodAfter !== undefined && moodAfter === null) return null

  return {
    toolId,
    durationSecs,
    moodBefore: moodBefore ?? undefined,
    moodAfter: moodAfter ?? undefined,
  }
}

export function sanitizeInsightChatMessages(raw: unknown): { role: 'user'; content: string }[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (m): m is { role: 'user'; content: string } =>
        typeof m === 'object' &&
        m !== null &&
        m.role === 'user' &&
        typeof m.content === 'string' &&
        m.content.length > 0 &&
        m.content.length <= 500
    )
}

export function validateSignupPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) return null
  if (password.length > 128) return null
  return password
}
