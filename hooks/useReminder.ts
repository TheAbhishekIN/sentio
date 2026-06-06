'use client'

import { useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'

export function useReminderScheduler() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)

  useEffect(() => {
    if (!profile?.reminderTime || typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const check = () => {
      const now = new Date()
      const [h, m] = profile.reminderTime!.split(':').map(Number)
      if (now.getHours() === h && now.getMinutes() === m) {
        const key = `sentio-reminder-${now.toISOString().split('T')[0]}`
        if (!localStorage.getItem(key)) {
          new Notification('Sentio', {
            body: 'Time for your daily check-in. How are you feeling?',
            icon: '/icon.svg',
          })
          localStorage.setItem(key, '1')
        }
      }
    }

    const id = setInterval(check, 60_000)
    check()
    return () => clearInterval(id)
  }, [profile?.reminderTime])
}
