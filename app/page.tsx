import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfile, upsertProfile } from '@/lib/db/profiles'
import { computePhase } from '@/lib/utils'
import { updatePhase } from '@/lib/db/profiles'
import { redirect } from 'next/navigation'

function nameFromUser(user: { user_metadata?: Record<string, unknown> }): string {
  const name = user.user_metadata?.name
  return typeof name === 'string' ? name.trim() : ''
}

export default async function RootPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let profile = await getProfile(supabase, user.id)
  const displayName = nameFromUser(user)

  if (!profile) {
    profile = await upsertProfile(supabase, {
      id: user.id,
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
    profile = await upsertProfile(supabase, { id: user.id, name: displayName })
  }

  if (!profile) redirect('/login')

  const computedPhase = computePhase(profile.examDate)
  if (computedPhase !== profile.phase && profile.phase !== 'result_wait') {
    await updatePhase(supabase, user.id, computedPhase)
  }

  if (!profile.onboardingComplete) redirect('/onboarding')
  redirect('/dashboard')
}
