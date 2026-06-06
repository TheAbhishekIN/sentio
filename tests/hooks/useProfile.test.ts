import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { makeProfile } from '../fixtures'
import { createQueryWrapper } from '../helpers/queryWrapper'

const mockGetProfile = vi.fn()
const mockUpsertProfile = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/db/profiles', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
}))

describe('useProfile hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetProfile.mockResolvedValue(makeProfile())
    mockUpsertProfile.mockResolvedValue(makeProfile({ name: 'Updated' }))
  })

  it('useProfile fetches when userId provided', async () => {
    const { result } = renderHook(() => useProfile('user-1'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetProfile).toHaveBeenCalledWith({}, 'user-1')
    expect(result.current.data?.name).toBe('Aarav')
  })

  it('useProfile stays idle without userId', () => {
    const { result } = renderHook(() => useProfile(undefined), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetProfile).not.toHaveBeenCalled()
  })

  it('useUpdateProfile upserts and updates cache', async () => {
    const wrapper = createQueryWrapper()
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await result.current.mutateAsync({ id: 'user-1', name: 'Updated' })

    expect(mockUpsertProfile).toHaveBeenCalledWith({}, { id: 'user-1', name: 'Updated' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
