import { cookies } from 'next/headers'
import { upsertProfile } from '@/lib/db/profiles'
import { mapAuthError } from '@/lib/auth-errors'
import { createClient, createServiceClient } from '@/utils/supabase/server'

export const runtime = 'edge'

async function signInAndRespond(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  userId: string,
  name: string
) {
  await upsertProfile(supabase, {
    id: userId,
    name,
    exam: 'Other',
    phase: 'preparation',
    streakCount: 0,
    totalCheckins: 0,
    aiEnabled: false,
    onboardingComplete: false,
    examDate: null,
    lastCheckinDate: null,
  })

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return Response.json({ error: mapAuthError(signInError.message) }, { status: 401 })
  }

  return Response.json({ success: true })
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    const trimmedName = typeof name === 'string' ? name.trim() : ''

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!trimmedName) {
      return Response.json({ error: 'Please enter your name' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Preferred: admin createUser skips confirmation emails entirely (no rate limit)
    if (serviceKey) {
      const admin = createServiceClient()

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: trimmedName },
      })

      if (createError) {
        if (createError.message.toLowerCase().includes('already')) {
          return Response.json({ error: 'Email already in use. Try logging in.' }, { status: 409 })
        }
        return Response.json({ error: mapAuthError(createError.message) }, { status: 400 })
      }

      if (!created.user) {
        return Response.json({ error: 'Could not create account' }, { status: 500 })
      }

      return signInAndRespond(supabase, email, password, created.user.id, trimmedName)
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: trimmedName } },
    })

    if (signUpError) {
      const isRateLimit =
        signUpError.message.toLowerCase().includes('rate limit') ||
        signUpError.message.toLowerCase().includes('over_email_send')

      if (isRateLimit) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!signInError && signInData.user) {
          return signInAndRespond(
            supabase,
            email,
            password,
            signInData.user.id,
            trimmedName
          )
        }

        return Response.json({
          error:
            'Email rate limit reached, but your account may exist. Try logging in, or add SUPABASE_SERVICE_ROLE_KEY to skip confirmation emails.',
        }, { status: 429 })
      }

      return Response.json({ error: mapAuthError(signUpError.message) }, { status: 400 })
    }

    if (!data.user) {
      return Response.json({ error: 'Could not create account' }, { status: 500 })
    }

    if (data.session) {
      return signInAndRespond(supabase, email, password, data.user.id, trimmedName)
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError && signInData.user) {
      return signInAndRespond(supabase, email, password, signInData.user.id, trimmedName)
    }

    return Response.json({
      error:
        'Account may have been created but email confirmation is required. Add SUPABASE_SERVICE_ROLE_KEY to .env.local to enable instant signup, or disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.',
    }, { status: 403 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
