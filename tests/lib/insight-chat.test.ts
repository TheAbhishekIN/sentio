import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildInsightIntro,
  chatStorageKey,
  countUserMessages,
  loadChatMessages,
  MAX_INSIGHT_CHAT_USER_MESSAGES,
  saveChatMessages,
} from '@/lib/insight-chat'

describe('insight-chat', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('chatStorageKey is deterministic', () => {
    expect(chatStorageKey('u1', '2026-22')).toBe('sentio-insight-chat-u1-2026-22')
  })

  it('save and load round-trip messages', () => {
    const messages = [
      { role: 'user' as const, content: 'How can I sleep better?' },
      { role: 'assistant' as const, content: 'Try a wind-down routine.' },
    ]
    saveChatMessages('u1', '2026-22', messages)
    expect(loadChatMessages('u1', '2026-22')).toEqual(messages)
  })

  it('loadChatMessages returns empty for missing key', () => {
    expect(loadChatMessages('u1', '2026-22')).toEqual([])
  })

  it('loadChatMessages filters invalid entries', () => {
    sessionStorage.setItem(
      chatStorageKey('u1', '2026-22'),
      JSON.stringify([
        { role: 'user', content: 'ok' },
        { role: 'system', content: 'bad' },
        { role: 'user', content: 123 },
        null,
      ])
    )
    expect(loadChatMessages('u1', '2026-22')).toEqual([{ role: 'user', content: 'ok' }])
  })

  it('loadChatMessages handles corrupt JSON', () => {
    sessionStorage.setItem(chatStorageKey('u1', '2026-22'), '{not json')
    expect(loadChatMessages('u1', '2026-22')).toEqual([])
  })

  it('loadChatMessages handles non-array JSON', () => {
    sessionStorage.setItem(chatStorageKey('u1', '2026-22'), JSON.stringify({ foo: 1 }))
    expect(loadChatMessages('u1', '2026-22')).toEqual([])
  })

  it('countUserMessages counts only user role', () => {
    expect(
      countUserMessages([
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'c' },
      ])
    ).toBe(2)
  })

  it('buildInsightIntro includes recommendations and limit', () => {
    const intro = buildInsightIntro(['Sleep more', 'Walk daily'])
    expect(intro).toContain('1. Sleep more')
    expect(intro).toContain('2. Walk daily')
    expect(intro).toContain(String(MAX_INSIGHT_CHAT_USER_MESSAGES))
  })

  it('loadChatMessages returns empty without sessionStorage', () => {
    const original = globalThis.sessionStorage
    // @ts-expect-error simulate SSR
    delete globalThis.sessionStorage
    expect(loadChatMessages('u1', '2026-22')).toEqual([])
    globalThis.sessionStorage = original
  })
})

describe('insight-chat without sessionStorage branch', () => {
  it('returns empty when sessionStorage undefined', () => {
    vi.stubGlobal('sessionStorage', undefined)
    expect(loadChatMessages('u1', '2026-22')).toEqual([])
    vi.unstubAllGlobals()
  })
})
