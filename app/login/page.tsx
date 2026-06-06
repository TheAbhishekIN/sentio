'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { mapAuthError } from '@/lib/auth-errors'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(
    searchParams.get('error') === 'auth'
      ? 'Sign-in link expired. Please try again.'
      : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: name.trim() }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Could not create account')
          return
        }

        if (data.needsEmailConfirm) {
          setInfo(data.message)
          setIsSignUp(false)
          return
        }

        window.location.assign('/onboarding/')
        return
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? mapAuthError('Invalid credentials'))
        return
      }

      window.location.assign('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Sentio</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Your mind matters as much as your marks.
          </h1>
          <p className="mt-2 text-sm text-ink-subtle">
            A daily check-in companion for students navigating exam pressure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm text-ink-muted">
                Your name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-ink-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-ink-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {info && (
            <p className="text-sm text-success" role="status">
              {info}
            </p>
          )}

          <LoadingButton type="submit" loading={loading} loadingText="Please wait…" className="w-full">
            {isSignUp ? 'Create account' : 'Log in'}
          </LoadingButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-subtle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setInfo(null)
            }}
            className="text-primary hover:text-primary-hover"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>

        <p className="mt-4 text-center text-xs text-ink-tertiary">
          Your data stays private in your account.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-ink-subtle">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
