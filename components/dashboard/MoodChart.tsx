'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { MOOD_COLORS, MOOD_EMOJIS, MOOD_LABELS } from '@/lib/constants'
import { formatShortDate, truncate } from '@/lib/utils'
import type { MoodCheckin } from '@/lib/types'

export function MoodTrendMini({ checkins }: { checkins: MoodCheckin[] }) {
  const [selected, setSelected] = useState<MoodCheckin | null>(null)

  const sorted = [...checkins].reverse().slice(-7)
  const data = sorted.map((c) => ({
    date: formatShortDate(c.checkinDate),
    mood: c.moodScore,
    checkin: c,
  }))

  if (!data.length) {
    return (
      <div className="card py-8 text-center text-sm text-ink-subtle">
        Check in daily to see your mood trend
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">7-day mood</p>
          <Link href="/journal" className="text-xs text-primary hover:text-primary-hover">
            All entries →
          </Link>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#8a8f98', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis domain={[0, 5]} hide />
              <Tooltip
                contentStyle={{
                  background: '#141516',
                  border: '1px solid #23252a',
                  borderRadius: 8,
                  color: '#f7f8f8',
                }}
              />
              <Bar
                dataKey="mood"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(bar) => {
                  const payload = bar?.payload as { checkin?: MoodCheckin } | undefined
                  if (payload?.checkin) setSelected(payload.checkin)
                }}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={MOOD_COLORS[entry.mood]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 md:items-center md:justify-center"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Day summary"
        >
          <div
            className="w-full max-w-md rounded-t-xl border border-hairline bg-surface-1 p-6 md:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-ink-subtle">{formatShortDate(selected.checkinDate)}</p>
            <p className="mt-1 text-2xl">
              {MOOD_EMOJIS[selected.moodScore]}{' '}
              <span className="text-base text-ink-muted">{MOOD_LABELS[selected.moodScore]}</span>
            </p>
            <p className="mt-3 text-sm text-ink-muted">{truncate(selected.journalEntry, 120)}</p>
            <div className="mt-4 flex gap-2 text-xs text-ink-subtle">
              <span>😴 {selected.sleepHours}h sleep</span>
              <span>📚 {selected.studyHours}h study</span>
            </div>
            <Link
              href={`/journal/${selected.checkinDate}`}
              className="btn-primary mt-4 block text-center"
            >
              View full entry
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

export function ToolkitShortcuts() {
  const tools = [
    { href: '/toolkit/breathing', label: 'Breathing', emoji: '🌬️' },
    { href: '/toolkit/break-timer', label: 'Break Timer', emoji: '⏱️' },
    { href: '/toolkit/anchor', label: 'Your Why', emoji: '⚓' },
  ]

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink">Quick toolkit</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex min-w-[120px] shrink-0 flex-col gap-2 rounded-lg border border-hairline bg-surface-1 p-4 transition-colors hover:bg-surface-2"
          >
            <span className="text-2xl">{tool.emoji}</span>
            <span className="text-sm text-ink-muted">{tool.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
