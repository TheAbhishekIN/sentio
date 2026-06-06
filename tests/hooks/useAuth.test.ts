import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getUserDisplayName, useAuth } from '@/hooks/useAuth'
import { makeUser } from '../helpers/mockSupabase'

const mockGetUser = vi.fn()
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: makeUser() } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  it('loads user from getUser', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.id).toBe('user-1')
  })

  it('updates user on auth state change', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: { user: unknown } | null) => void) => {
      callback('SIGNED_IN', { user: makeUser({ id: 'user-2' }) })
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.user?.id).toBe('user-2'))
  })

  it('clears user when session is null', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: null) => void) => {
      callback('SIGNED_OUT', null)
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.user).toBeNull())
  })

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled())
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})

describe('getUserDisplayName', () => {
  it('returns empty string for null user', () => {
    expect(getUserDisplayName(null)).toBe('')
  })

  it('returns trimmed name from metadata', () => {
    expect(getUserDisplayName(makeUser({ user_metadata: { name: '  Aarav  ' } }))).toBe('Aarav')
  })

  it('returns empty when metadata name is not a string', () => {
    expect(getUserDisplayName(makeUser({ user_metadata: { name: 123 } }))).toBe('')
  })
})
