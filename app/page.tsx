import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let ctaHref = '/login'
  let ctaLabel = 'Get started free'
  let isLoggedIn = false

  if (user) {
    isLoggedIn = true
    const profile = await getProfile(supabase, user.id)

    if (profile?.onboardingComplete) {
      ctaHref = '/dashboard'
      ctaLabel = 'Open dashboard'
    } else {
      ctaHref = '/onboarding'
      ctaLabel = 'Complete setup'
    }
  }

  return <LandingPage ctaHref={ctaHref} ctaLabel={ctaLabel} isLoggedIn={isLoggedIn} />
}
