import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callAI } from '@/lib/ai'

describe('callAI', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'gemini-flash-latest' }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
          }),
          { status: 200 }
        )
      )
    )
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('throws when API key missing', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY
    await expect(callAI([{ role: 'user', content: 'hi' }])).rejects.toThrow('Missing GEMINI_API_KEY')
  })

  it('uses GOOGLE_API_KEY fallback', async () => {
    delete process.env.GEMINI_API_KEY
    process.env.GOOGLE_API_KEY = 'google-key'
    const text = await callAI([{ role: 'user', content: 'hi' }])
    expect(text).toBe('Hello from Gemini')
  })

  it('returns text on success with system and assistant messages', async () => {
    const text = await callAI([
      { role: 'system', content: 'Be helpful' },
      { role: 'assistant', content: 'prior' },
      { role: 'user', content: 'hi' },
    ], { maxTokens: 100, model: 'custom-model' })
    expect(text).toBe('Hello from Gemini')
    expect(fetch).toHaveBeenCalledOnce()
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toContain('custom-model')
    expect(init?.headers).toMatchObject({ 'X-goog-api-key': 'test-key' })
  })

  it('throws on non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 502 })))
    await expect(callAI([{ role: 'user', content: 'hi' }])).rejects.toThrow('Gemini error 502')
  })

  it('throws on API error payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: 'Invalid key' } }), { status: 400 })
      )
    )
    await expect(callAI([{ role: 'user', content: 'hi' }])).rejects.toThrow('Gemini failed: Invalid key')
  })

  it('throws on empty candidate text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '  ' }] } }] }), {
          status: 200,
        })
      )
    )
    await expect(callAI([{ role: 'user', content: 'hi' }])).rejects.toThrow('empty response')
  })
})
