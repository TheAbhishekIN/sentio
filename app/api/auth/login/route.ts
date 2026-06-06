import { cookies } from 'next/headers'
import { upsertProfile } from '@/lib/db/profiles'
import { mapAuthError } from '@/lib/auth-errors'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return Response.json({ error: mapAuthError(error.message) }, { status: 401 })
    }

    if (data.user) {
      const name =
        typeof data.user.user_metadata?.name === 'string' ? data.user.user_metadata.name.trim() : ''
      if (name) {
        await upsertProfile(supabase, { id: data.user.id, name }).catch(() => {})
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
