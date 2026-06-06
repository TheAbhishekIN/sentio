import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAllCheckins,
  useRecentCheckins,
  useTodayCheckin,
} from '@/hooks/useCheckin'
import { makeCheckin } from '../fixtures'
import { createQueryWrapper } from '../helpers/queryWrapper'

const mockGetCheckinByDate = vi.fn()
const mockGetRecentCheckins = vi.fn()
const mockGetAllCheckins = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/db/checkins', () => ({
  getCheckinByDate: (...args: unknown[]) => mockGetCheckinByDate(...args),
  getRecentCheckins: (...args: unknown[]) => mockGetRecentCheckins(...args),
  getAllCheckins: (...args: unknown[]) => mockGetAllCheckins(...args),
}))

describe('useCheckin hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCheckinByDate.mockResolvedValue(makeCheckin())
    mockGetRecentCheckins.mockResolvedValue([makeCheckin()])
    mockGetAllCheckins.mockResolvedValue([makeCheckin()])
  })

  it('useTodayCheckin fetches when userId and date provided', async () => {
    const { result } = renderHook(() => useTodayCheckin('user-1', '2026-06-06'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetCheckinByDate).toHaveBeenCalledWith({}, 'user-1', '2026-06-06')
    expect(result.current.data?.checkinDate).toBe('2026-06-01')
  })

  it('useTodayCheckin stays idle without userId or date', () => {
    const { result } = renderHook(() => useTodayCheckin(undefined, '2026-06-06'), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetCheckinByDate).not.toHaveBeenCalled()
  })

  it('useRecentCheckins fetches when userId provided', async () => {
    const { result } = renderHook(() => useRecentCheckins('user-1', 14), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetRecentCheckins).toHaveBeenCalledWith({}, 'user-1', 14)
  })

  it('useRecentCheckins stays idle without userId', () => {
    const { result } = renderHook(() => useRecentCheckins(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetRecentCheckins).not.toHaveBeenCalled()
  })

  it('useAllCheckins fetches when userId provided', async () => {
    const { result } = renderHook(() => useAllCheckins('user-1'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAllCheckins).toHaveBeenCalledWith({}, 'user-1')
  })

  it('useAllCheckins stays idle without userId', () => {
    const { result } = renderHook(() => useAllCheckins(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAllCheckins).not.toHaveBeenCalled()
  })
})
