'use client'

import { AppShell } from '@/components/layout/AppShell'
import {
  BurnoutAlert,
  CheckinCTA,
  MoodRing,
  PhaseCard,
  QuickStats,
  StreakCard,
} from '@/components/dashboard/DashboardCards'
import { MoodTrendMini, ToolkitShortcuts } from '@/components/dashboard/MoodChart'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useRecentCheckins, useTodayCheckin } from '@/hooks/useCheckin'
import { avg, daysUntil, getGreeting, todayISO } from '@/lib/utils'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SkeletonCard } from '@/components/ui/LoadingOverlay'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const today = todayISO()
  const { data: todayCheckin } = useTodayCheckin(user?.id, today)
  const { data: recentCheckins = [] } = useRecentCheckins(user?.id, 7)
  const [burnout, setBurnout] = useState<{ score: number; risk: string } | null>(null)
  const [burnoutLoading, setBurnoutLoading] = useState(true)

  useEffect(() => {
    setBurnoutLoading(true)
    fetch('/api/insights/burnout')
      .then((r) => r.json())
      .then(setBurnout)
      .catch(() => {})
      .finally(() => setBurnoutLoading(false))
  }, [])

  const yesterday = recentCheckins.find((c) => c.checkinDate !== today)
  const avgMood = avg(recentCheckins.map((c) => c.moodScore))

  return (
    <AppShell>
      <div className="page-container space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {getGreeting()}, {profile?.name || 'there'} ☀️
          </h1>
          {profile && (
            <PhaseCard
              exam={profile.exam}
              phase={profile.phase}
              daysLeft={daysUntil(profile.examDate)}
            />
          )}
        </div>

        {profile && <StreakCard streakCount={profile.streakCount} />}

        {todayCheckin ? (
          <Link href={`/journal/${today}`}>
            <MoodRing moodScore={todayCheckin.moodScore} />
          </Link>
        ) : (
          <CheckinCTA href="/checkin" />
        )}

        <QuickStats
          avgMood={avgMood}
          sleepHours={yesterday?.sleepHours ?? 0}
          studyHours={yesterday?.studyHours ?? 0}
        />

        {burnoutLoading ? (
          <SkeletonCard className="h-24" />
        ) : (
          burnout && <BurnoutAlert score={burnout.score} risk={burnout.risk} />
        )}

        <MoodTrendMini checkins={recentCheckins} />

        <Link
          href="/journal"
          className="card flex items-center justify-between transition-colors hover:bg-surface-2"
        >
          <div>
            <p className="font-medium text-ink">Your reflections</p>
            <p className="text-sm text-ink-subtle">Browse your journal entries</p>
          </div>
          <span className="text-primary">→</span>
        </Link>

        <ToolkitShortcuts />
      </div>
    </AppShell>
  )
}
