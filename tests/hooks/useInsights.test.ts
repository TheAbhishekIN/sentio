import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecentInsights } from '@/hooks/useInsights'
import { makeInsight } from '../fixtures'
import { createQueryWrapper } from '../helpers/queryWrapper'

const mockGetRecentInsights = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/db/insights', () => ({
  getRecentInsights: (...args: unknown[]) => mockGetRecentInsights(...args),
}))

describe('useRecentInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRecentInsights.mockResolvedValue([makeInsight()])
  })

  it('fetches when userId provided', async () => {
    const { result } = renderHook(() => useRecentInsights('user-1', 6), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetRecentInsights).toHaveBeenCalledWith({}, 'user-1', 6)
    expect(result.current.data).toHaveLength(1)
  })

  it('stays idle without userId', () => {
    const { result } = renderHook(() => useRecentInsights(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetRecentInsights).not.toHaveBeenCalled()
  })
})
