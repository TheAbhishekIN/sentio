import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfile, upsertProfile } from '@/lib/db/profiles'
import { safeRedirectPath } from '@/lib/security'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

function nameFromUser(user: { user_metadata?: Record<string, unknown> }): string {
  const name = user.user_metadata?.name
  return typeof name === 'string' ? name.trim() : ''
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const displayName = nameFromUser(data.user)
      const profile = await getProfile(supabase, data.user.id)

      if (!profile) {
        await upsertProfile(supabase, {
          id: data.user.id,
          name: displayName,
          exam: 'Other',
          phase: 'preparation',
          streakCount: 0,
          totalCheckins: 0,
          aiEnabled: false,
          onboardingComplete: false,
          examDate: null,
          lastCheckinDate: null,
        })
      } else if (displayName && !profile.name) {
        await upsertProfile(supabase, { id: data.user.id, name: displayName })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login/?error=auth`)
}
