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

function getGeminiConfig() {
  const apiKey = (
    process.env['GEMINI_API_KEY'] ?? process.env['GOOGLE_API_KEY']
  )?.trim()
  const model = (process.env.GEMINI_MODEL ?? 'gemini-flash-latest').trim()

  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY — set it in .env.local (dev) or Cloudflare Pages secrets (production)'
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
 * Google Gemini generateContent API (edge-compatible — Cloudflare Workers / Pages).
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
