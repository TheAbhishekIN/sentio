'use client'

import Link from 'next/link'
import { MOOD_EMOJIS } from '@/lib/constants'
import { cn, formatShortDate, recentDaysISO, relativeDayLabel, todayISO } from '@/lib/utils'
import type { MoodCheckin } from '@/lib/types'

const BACKFILL_DAYS = 4

export function RecentDaysPicker({
  checkins = [],
  selectedDate,
  className,
}: {
  checkins?: MoodCheckin[]
  selectedDate?: string
  className?: string
}) {
  const dates = recentDaysISO(BACKFILL_DAYS)
  const byDate = new Map(checkins.map((c) => [c.checkinDate, c]))
  const filledCount = dates.filter((d) => byDate.has(d)).length

  return (
    <div className={cn('card space-y-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">Last {BACKFILL_DAYS} days</p>
          <p className="text-xs text-ink-subtle">
            Add or edit check-ins to unlock insights and test AI reflections.
          </p>
        </div>
        <span className="shrink-0 text-xs text-ink-subtle">
          {filledCount}/{BACKFILL_DAYS}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {dates.map((date) => {
          const entry = byDate.get(date)
          const isSelected = selectedDate === date
          const href = `/checkin?date=${date}`

          return (
            <Link
              key={date}
              href={href}
              className={cn(
                'flex flex-col items-center rounded-lg border px-2 py-3 text-center transition-colors',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-hairline bg-surface-2 hover:border-hairline-strong hover:bg-surface-3',
                entry && !isSelected && 'border-success/30'
              )}
            >
              <span className="text-xs font-medium text-ink">{relativeDayLabel(date)}</span>
              <span className="text-[10px] text-ink-subtle">{formatShortDate(date)}</span>
              {entry ? (
                <span className="mt-1 text-xl" title="Check-in saved">
                  {MOOD_EMOJIS[entry.moodScore]}
                </span>
              ) : (
                <span className="mt-1 text-xs text-primary">+ Add</span>
              )}
            </Link>
          )
        })}
      </div>
      {!checkins.some((c) => c.checkinDate === todayISO()) && (
        <p className="text-xs text-ink-subtle">
          Tip: write at least 30 characters in your journal to trigger an AI reflection (enable AI in Settings).
        </p>
      )}
      {filledCount < 3 && (
        <p className="text-xs text-ink-subtle">
          Add {3 - filledCount} more day{3 - filledCount === 1 ? '' : 's'} to unlock insights.
        </p>
      )}
    </div>
  )
}

export { BACKFILL_DAYS }
