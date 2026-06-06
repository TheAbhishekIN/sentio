import { cookies } from 'next/headers'
import { calculateBurnoutScore } from '@/lib/burnout'
import { getRecentCheckins } from '@/lib/db/checkins'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checkins = await getRecentCheckins(supabase, user.id, 7)
    const { score, risk, factors } = calculateBurnoutScore(checkins)

    return Response.json({ score, risk, factors })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
