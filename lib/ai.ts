import { loadEnvConfig } from '@next/env'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] }
  }[]
  error?: { message?: string; code?: number; status?: string }
}

let envLoaded = false

/** Read a key from .env files on disk — wins over stale process.env in local dev. */
export function readEnvFileKey(key: string): string | undefined {
  const cwd = process.cwd()
  for (const file of ['.env.local', '.env.development.local', '.env.development', '.env']) {
    try {
      const content = readFileSync(join(cwd, file), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const k = trimmed.slice(0, eq).trim()
        let v = trimmed.slice(eq + 1).trim()
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1)
        }
        if (k === key && v) return v
      }
    } catch {
      // file missing — try next
    }
  }
  return undefined
}

function ensureEnvLoaded() {
  if (envLoaded) return
  // Stale empty values from a former next.config `env` block block .env.local from loading.
  if (process.env.GEMINI_API_KEY === '') delete process.env.GEMINI_API_KEY
  if (process.env.GOOGLE_API_KEY === '') delete process.env.GOOGLE_API_KEY
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production')
  envLoaded = true
}

function getGeminiConfig() {
  ensureEnvLoaded()

  const apiKey = (
    readEnvFileKey('GEMINI_API_KEY') ??
    readEnvFileKey('GOOGLE_API_KEY') ??
    process.env['GEMINI_API_KEY'] ??
    process.env['GOOGLE_API_KEY']
  )?.trim()
  const model = (
    readEnvFileKey('GEMINI_MODEL') ??
    process.env.GEMINI_MODEL ??
    'gemini-flash-latest'
  ).trim()

  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY — add it to .env.local (not .env.example) and restart the dev server'
    )
  }

  return { apiKey, model }
}

function toGeminiPayload(messages: ChatMessage[], maxTokens: number) {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }

  if (systemParts) {
    body.systemInstruction = { parts: [{ text: systemParts }] }
  }

  return body
}

function extractGeminiText(data: GeminiResponse): string {
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (text) return text

  throw new Error('Gemini returned an empty response')
}

/**
 * Google Gemini generateContent API (server-side only).
 */
export async function callAI(
  messages: ChatMessage[],
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const { apiKey, model: defaultModel } = getGeminiConfig()
  const model = options.model ?? defaultModel
  const maxTokens = options.maxTokens ?? 2048

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  )
  url.searchParams.set('key', apiKey)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify(toGeminiPayload(messages, maxTokens)),
  })

  const raw = await res.text()
  let data: GeminiResponse

  try {
    data = JSON.parse(raw) as GeminiResponse
  } catch {
    throw new Error(`Gemini error ${res.status}: ${raw.slice(0, 200)}`)
  }

  if (!res.ok) {
    throw new Error(
      `Gemini failed: ${data.error?.message ?? raw.slice(0, 300) ?? `HTTP ${res.status}`}`
    )
  }

  return extractGeminiText(data)
}
