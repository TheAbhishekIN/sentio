import { cookies } from 'next/headers'
import { genericApiError } from '@/lib/security'
import { createClient, createServiceClient } from '@/utils/supabase/server'

export const runtime = 'edge'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { error: 'Account deletion requires SUPABASE_SERVICE_ROLE_KEY' },
        { status: 503 }
      )
    }

    const admin = createServiceClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) throw error

    await supabase.auth.signOut()

    return Response.json({ success: true })
  } catch (err) {
    console.error('Account delete error:', err)
    return Response.json({ error: genericApiError() }, { status: 500 })
  }
}
