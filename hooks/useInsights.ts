'use client'

import { createClient } from '@/utils/supabase/client'
import { getRecentInsights } from '@/lib/db/insights'
import { useQuery } from '@tanstack/react-query'

export function useRecentInsights(userId?: string, n = 4) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['insights', userId, n],
    queryFn: () => getRecentInsights(supabase, userId!, n),
    enabled: !!userId,
  })
}
