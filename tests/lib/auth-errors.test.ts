import { describe, expect, it } from 'vitest'
import { mapAuthError } from '@/lib/auth-errors'

describe('mapAuthError', () => {
  it('maps rate limit errors', () => {
    expect(mapAuthError('Email rate limit exceeded')).toContain('rate limit')
    expect(mapAuthError('over_email_send quota')).toContain('rate limit')
  })

  it('maps email not confirmed', () => {
    expect(mapAuthError('Email not confirmed')).toContain('not confirmed')
  })

  it('maps invalid credentials', () => {
    expect(mapAuthError('Invalid login credentials')).toBe('Invalid email or password.')
    expect(mapAuthError('invalid credentials')).toBe('Invalid email or password.')
  })

  it('maps already registered', () => {
    expect(mapAuthError('User already registered')).toContain('already in use')
    expect(mapAuthError('already been registered')).toContain('already in use')
  })

  it('maps weak password', () => {
    expect(mapAuthError('Password is too weak')).toContain('too weak')
  })

  it('returns generic message when unmatched', () => {
    expect(mapAuthError('Something unexpected')).toBe('Something went wrong. Please try again.')
  })
})
