'use client'

import { MOOD_EMOJIS } from '@/lib/constants'

interface StreakCardProps {
  streakCount: number
}

export function StreakCard({ streakCount }: StreakCardProps) {
  const milestone =
    streakCount >= 30 ? '30-day champion' : streakCount >= 14 ? '2-week streak' : streakCount >= 7 ? '1-week streak' : null

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-sm text-ink-subtle">Current streak</p>
        <p className="text-3xl font-semibold tracking-tight text-ink">
          🔥 {streakCount} <span className="text-lg font-normal text-ink-muted">days</span>
        </p>
      </div>
      {milestone && (
        <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs text-ink-muted">
          {milestone}
        </span>
      )}
    </div>
  )
}

export function MoodRing({
  moodScore,
  onClick,
}: {
  moodScore: number
  onClick?: () => void
}) {
  const color =
    moodScore === 1
      ? '#EF4444'
      : moodScore === 2
        ? '#F97316'
        : moodScore === 3
          ? '#EAB308'
          : moodScore === 4
            ? '#22C55E'
            : '#8B5CF6'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Today's mood: ${moodScore} out of 5`}
      className="card flex w-full flex-col items-center gap-3 py-8 transition-colors hover:bg-surface-2"
    >
      <div
        className="flex h-28 w-28 items-center justify-center rounded-full border-4 text-4xl"
        style={{ borderColor: color }}
      >
        {MOOD_EMOJIS[moodScore]}
      </div>
      <p className="text-sm text-ink-muted">Checked in today · Tap to view journal</p>
    </button>
  )
}

export function CheckinCTA({ href }: { href: string }) {
  const hour = new Date().getHours()
  const theme =
    hour >= 5 && hour < 12
      ? 'from-amber-500/15'
      : hour >= 12 && hour < 17
        ? 'from-sky-500/15'
        : hour >= 17 && hour < 21
          ? 'from-primary/15'
          : 'from-indigo-900/30'

  return (
    <a
      href={href}
      className={`card block bg-gradient-to-br ${theme} to-surface-1 py-8 text-center transition-transform hover:scale-[1.01]`}
    >
      <p className="mb-2 text-lg font-medium text-ink">How are you feeling today?</p>
      <span className="btn-primary inline-flex">Start check-in</span>
    </a>
  )
}

export function QuickStats({
  avgMood,
  sleepHours,
  studyHours,
}: {
  avgMood: number
  sleepHours: number
  studyHours: number
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatPill label="Avg mood" value={avgMood ? avgMood.toFixed(1) : '—'} />
      <StatPill label="Sleep" value={sleepHours ? `${sleepHours}h` : '—'} />
      <StatPill label="Study" value={studyHours ? `${studyHours}h` : '—'} />
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 px-3 py-3 text-center">
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className="text-lg font-medium text-ink">{value}</p>
    </div>
  )
}

export function BurnoutAlert({
  score,
  risk,
}: {
  score: number
  risk: string
}) {
  if (score <= 65) return null

  const isCritical = risk === 'critical' || risk === 'high'

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCritical ? 'border-danger/50 bg-danger/10' : 'border-warning/50 bg-warning/10'
      }`}
      role="alert"
    >
      <p className="font-medium text-ink">Burnout alert</p>
      <p className="mt-1 text-sm text-ink-muted">
        Your burnout score is {score}/100. Consider a break or a coping exercise from the
        toolkit.
      </p>
    </div>
  )
}

export function PhaseCard({
  exam,
  phase,
  daysLeft,
}: {
  exam: string
  phase: string
  daysLeft: number | null
}) {
  return (
    <p className="text-sm text-ink-muted">
      {exam} · {phase.replace('_', ' ')}
      {daysLeft !== null && daysLeft >= 0 && ` · ${daysLeft} days`}
    </p>
  )
}
