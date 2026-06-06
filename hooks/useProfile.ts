'use client'

import { createClient } from '@/utils/supabase/client'
import { getProfile } from '@/lib/db/profiles'
import type { UserProfile } from '@/lib/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProfile(userId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(supabase, userId!),
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profile: Partial<UserProfile> & { id: string }) => {
      const { upsertProfile } = await import('@/lib/db/profiles')
      return upsertProfile(supabase, profile)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.id], data)
    },
  })
}
