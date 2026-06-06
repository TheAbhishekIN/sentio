'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { useAllCheckins } from '@/hooks/useCheckin'
import { MOOD_EMOJIS, MOOD_LABELS, TRIGGER_LABELS } from '@/lib/constants'
import { truncate, formatShortDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'week' | 'month' | 'mood'

export default function JournalPage() {
  const { user } = useAuth()
  const { data: checkins = [], isLoading } = useAllCheckins(user?.id)
  const [filter, setFilter] = useState<Filter>('all')
  const [moodFilter, setMoodFilter] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let list = [...checkins]
    const now = new Date()
    if (filter === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      list = list.filter((c) => new Date(c.checkinDate) >= weekAgo)
    }
    if (filter === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      list = list.filter((c) => new Date(c.checkinDate) >= monthAgo)
    }
    if (filter === 'mood' && moodFilter) {
      list = list.filter((c) => c.moodScore === moodFilter)
    }
    return list
  }, [checkins, filter, moodFilter])

  return (
    <AppShell>
      <div className="page-container">
        <TopBar title="Your Reflections" />
        <p className="-mt-4 mb-4 text-sm text-ink-subtle">{checkins.length} entries</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'week', 'month', 'mood'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn('chip capitalize', filter === f && 'chip-selected')}
            >
              {f === 'all' ? 'All' : f === 'week' ? 'This week' : f === 'month' ? 'This month' : 'By mood'}
            </button>
          ))}
        </div>

        {filter === 'mood' && (
          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoodFilter(m)}
                className={cn('chip', moodFilter === m && 'chip-selected')}
              >
                {MOOD_EMOJIS[m]}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-1" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="card py-10 text-center text-ink-subtle">
            No entries yet. Start your first check-in!
            <Link href="/checkin" className="btn-primary mt-4 inline-flex">
              Check in now
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((entry) => (
            <Link
              key={entry.id}
              href={`/journal/${entry.checkinDate}`}
              className="card block transition-colors hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{formatShortDate(entry.checkinDate)}</p>
                  <p className="mt-1 text-sm text-ink-muted">{truncate(entry.journalEntry, 80)}</p>
                </div>
                <span className="text-xl">{MOOD_EMOJIS[entry.moodScore]}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-subtle">
                  {MOOD_LABELS[entry.moodScore]}
                </span>
                {entry.triggers.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-subtle">
                    {TRIGGER_LABELS[t]}
                  </span>
                ))}
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-subtle">
                  😴 {entry.sleepHours}h
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-subtle">
                  📚 {entry.studyHours}h
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
