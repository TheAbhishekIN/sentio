import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReminderScheduler } from '@/hooks/useReminder'
import { makeProfile } from '../fixtures'

const mockUseAuth = vi.fn()
const mockUseProfile = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: (userId?: string) => mockUseProfile(userId),
}))

describe('useReminderScheduler', () => {
  const notificationMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T09:00:00'))
    vi.clearAllMocks()
    localStorage.clear()

    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    mockUseProfile.mockReturnValue({ data: makeProfile({ reminderTime: '09:00' }) })

    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: class {
        static permission = 'granted'
        constructor(title: string, options?: NotificationOptions) {
          notificationMock(title, options)
        }
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows notification at reminder time once per day', () => {
    renderHook(() => useReminderScheduler())

    expect(notificationMock).toHaveBeenCalledWith(
      'Sentio',
      expect.objectContaining({
        body: 'Time for your daily check-in. How are you feeling?',
      })
    )
    expect(localStorage.getItem('sentio-reminder-2026-06-06')).toBe('1')

    notificationMock.mockClear()
    vi.advanceTimersByTime(60_000)
    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('does nothing without reminder time', () => {
    mockUseProfile.mockReturnValue({ data: makeProfile({ reminderTime: null }) })
    renderHook(() => useReminderScheduler())
    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('does nothing when notification permission is not granted', () => {
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: class {
        static permission = 'denied'
        constructor() {}
      },
    })

    renderHook(() => useReminderScheduler())
    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('does nothing when Notification API is unavailable', () => {
    // @ts-expect-error test stub
    delete globalThis.Notification

    renderHook(() => useReminderScheduler())
    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('does not notify at a different time of day', () => {
    vi.setSystemTime(new Date('2026-06-06T14:30:00'))
    renderHook(() => useReminderScheduler())
    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('clears interval on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useReminderScheduler())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

})
