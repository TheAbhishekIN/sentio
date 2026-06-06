import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInsightByWeek } from '@/hooks/useInsightByWeek'
import { makeInsight } from '../fixtures'
import { createQueryWrapper } from '../helpers/queryWrapper'

const mockGetInsightByWeek = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/db/insights', () => ({
  getInsightByWeek: (...args: unknown[]) => mockGetInsightByWeek(...args),
}))

describe('useInsightByWeek', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetInsightByWeek.mockResolvedValue(makeInsight())
  })

  it('fetches when userId and weekOf provided', async () => {
    const { result } = renderHook(() => useInsightByWeek('user-1', '2026-22'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetInsightByWeek).toHaveBeenCalledWith({}, 'user-1', '2026-22')
    expect(result.current.data?.weekOf).toBe('2026-22')
  })

  it('stays idle without userId or weekOf', () => {
    const { result } = renderHook(() => useInsightByWeek('user-1', undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetInsightByWeek).not.toHaveBeenCalled()
  })
})
