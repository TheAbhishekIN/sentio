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
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return Response.json({ error: mapAuthError(signInError.message) }, { status: 401 })
  }

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
  }).catch(() => {})

  return Response.json({ success: true })
}

async function createUserViaEdgeFunction(
  email: string,
  password: string,
  name: string
): Promise<{ userId: string } | { error: string; status: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    return { error: 'Server configuration error', status: 500 }
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/auth-signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ email, password, name }),
  })

  const data = (await res.json()) as { userId?: string; error?: string }

  if (!res.ok) {
    return { error: data.error ?? 'Could not create account', status: res.status }
  }

  if (!data.userId) {
    return { error: 'Could not create account', status: 500 }
  }

  return { userId: data.userId }
}

async function createUserWithAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ userId: string } | { error: string; status: number }> {
  const admin = createServiceClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createError) {
    if (createError.message.toLowerCase().includes('already')) {
      return { error: 'Email already in use. Try logging in.', status: 409 }
    }
    return { error: mapAuthError(createError.message), status: 400 }
  }

  if (!created.user) {
    return { error: 'Could not create account', status: 500 }
  }

  return { userId: created.user.id }
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

    const created = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createUserWithAdmin(email, password, trimmedName)
      : await createUserViaEdgeFunction(email, password, trimmedName)

    if ('error' in created) {
      return Response.json({ error: created.error }, { status: created.status })
    }

    return await signInAndRespond(supabase, email, password, created.userId, trimmedName)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
