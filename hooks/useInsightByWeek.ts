'use client'

import { createClient } from '@/utils/supabase/client'
import { getInsightByWeek } from '@/lib/db/insights'
import { useQuery } from '@tanstack/react-query'

export function useInsightByWeek(userId?: string, weekOf?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['insight', userId, weekOf],
    queryFn: () => getInsightByWeek(supabase, userId!, weekOf!),
    enabled: !!userId && !!weekOf,
  })
}
