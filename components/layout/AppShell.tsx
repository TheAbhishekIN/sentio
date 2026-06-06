'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BottomNav } from './BottomNav'
import { PageTransition } from './PageTransition'
import { useReminderScheduler } from '@/hooks/useReminder'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useReminderScheduler()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-md bg-surface-1" />
          <div className="h-32 animate-pulse rounded-lg bg-surface-1" />
          <div className="h-48 animate-pulse rounded-lg bg-surface-1" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <PageTransition>{children}</PageTransition>
      <BottomNav />
    </>
  )
}
