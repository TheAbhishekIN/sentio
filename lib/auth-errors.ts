export function mapAuthError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('over_email_send')) {
    return 'Email rate limit reached. Please wait a few minutes and try again, or log in if you already registered.'
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Try logging in — new accounts are confirmed automatically.'
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password.'
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Email already in use. Try logging in instead.'
  }

  if (lower.includes('password') && lower.includes('weak')) {
    return 'Password is too weak. Use at least 6 characters.'
  }

  return 'Something went wrong. Please try again.'
}
