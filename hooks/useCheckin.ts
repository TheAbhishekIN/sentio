'use client'

import { createClient } from '@/utils/supabase/client'
import {
  getAllCheckins,
  getCheckinByDate,
  getRecentCheckins,
} from '@/lib/db/checkins'
import { useQuery } from '@tanstack/react-query'

export function useTodayCheckin(userId?: string, date?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['checkin', userId, date],
    queryFn: () => getCheckinByDate(supabase, userId!, date!),
    enabled: !!userId && !!date,
  })
}

export function useRecentCheckins(userId?: string, n = 7) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['checkins', userId, n],
    queryFn: () => getRecentCheckins(supabase, userId!, n),
    enabled: !!userId,
  })
}

export function useAllCheckins(userId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['checkins-all', userId],
    queryFn: () => getAllCheckins(supabase, userId!),
    enabled: !!userId,
  })
}
