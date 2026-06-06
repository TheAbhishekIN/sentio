import { cookies } from 'next/headers'
import { saveCopingSession } from '@/lib/db/insights'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    await saveCopingSession(supabase, {
      userId: user.id,
      toolId: body.toolId,
      durationSecs: body.durationSecs ?? 0,
      moodBefore: body.moodBefore,
      moodAfter: body.moodAfter,
    })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
