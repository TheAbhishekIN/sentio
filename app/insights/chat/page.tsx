'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { InsightChatView } from '@/components/insights/InsightChatView'
import { InlineLoader } from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/hooks/useAuth'
import { useInsightByWeek } from '@/hooks/useInsightByWeek'
import { useProfile } from '@/hooks/useProfile'
import { getWeekOf } from '@/lib/utils'

function InsightChatContent() {
  const searchParams = useSearchParams()
  const weekOf = searchParams.get('week') ?? getWeekOf()
  const { user, loading: authLoading } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: insight, isLoading: insightLoading } = useInsightByWeek(user?.id, weekOf)

  if (authLoading || insightLoading) {
    return (
      <AppShell>
        <div className="page-container flex min-h-[70vh] flex-col">
          <TopBar title="Weekly insight chat" backHref="/insights/" />
          <InlineLoader label="Loading chat…" />
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <div className="page-container">
          <TopBar title="Weekly insight chat" backHref="/insights/" />
          <p className="text-ink-muted">Please sign in to continue.</p>
        </div>
      </AppShell>
    )
  }

  if (!profile?.aiEnabled) {
    return (
      <AppShell>
        <div className="page-container space-y-4">
          <TopBar title="Weekly insight chat" backHref="/insights/" />
          <div className="card py-8 text-center">
            <p className="text-ink-muted">AI is turned off in Settings.</p>
            <Link href="/settings/" className="mt-4 inline-block text-sm text-primary">
              Enable AI in Settings
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!insight) {
    return (
      <AppShell>
        <div className="page-container space-y-4">
          <TopBar title="Weekly insight chat" backHref="/insights/" />
          <div className="card py-8 text-center">
            <p className="text-ink-muted">Generate a weekly insight first to start chatting.</p>
            <Link href="/insights/" className="mt-4 inline-block text-sm text-primary">
              Go to Insights
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="page-container flex min-h-[calc(100vh-5rem)] flex-col">
        <TopBar title="Weekly insight chat" backHref="/insights/" />
        <p className="-mt-4 mb-4 text-xs text-ink-subtle">Week {weekOf.replace('-', ' · ')}</p>
        <InsightChatView userId={user.id} weekOf={weekOf} insight={insight} />
      </div>
    </AppShell>
  )
}

export default function InsightChatPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="page-container">
            <InlineLoader label="Loading…" />
          </div>
        </AppShell>
      }
    >
      <InsightChatContent />
    </Suspense>
  )
}
