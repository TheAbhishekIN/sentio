import { cookies } from 'next/headers'
import { saveCopingSession } from '@/lib/db/insights'
import { genericApiError, parseCopingSessionBody } from '@/lib/security'
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

    const session = parseCopingSessionBody(await req.json())
    if (!session) {
      return Response.json({ error: 'Invalid session data' }, { status: 400 })
    }

    await saveCopingSession(supabase, {
      userId: user.id,
      ...session,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Coping save error:', err)
    return Response.json({ error: genericApiError() }, { status: 500 })
  }
}
