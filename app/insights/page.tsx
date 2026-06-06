'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { RecentDaysPicker } from '@/components/checkin/RecentDaysPicker'
import { useAuth } from '@/hooks/useAuth'
import { useAllCheckins } from '@/hooks/useCheckin'
import { useRecentInsights } from '@/hooks/useInsights'
import { MOOD_COLORS, TRIGGER_LABELS } from '@/lib/constants'
import { avg, formatShortDate, getWeekOf } from '@/lib/utils'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { InlineLoader } from '@/components/ui/LoadingOverlay'
import { useToast } from '@/components/ui/Toast'

export default function InsightsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: checkins = [], isLoading } = useAllCheckins(user?.id)
  const { data: insights = [] } = useRecentInsights(user?.id)
  const currentWeek = getWeekOf()
  const currentWeekInsight = insights.find((i) => i.weekOf === currentWeek)
  const [burnout, setBurnout] = useState<{ score: number; risk: string; factors: string[] } | null>(null)
  const [burnoutLoading, setBurnoutLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    setBurnoutLoading(true)
    fetch('/api/insights/burnout')
      .then((r) => r.json())
      .then(setBurnout)
      .catch(() => {})
      .finally(() => setBurnoutLoading(false))
  }, [checkins.length])

  const weekCheckins = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return checkins.filter((c) => new Date(c.checkinDate) >= weekAgo)
  }, [checkins])

  const moodTrend = [...checkins].reverse().slice(-7).map((c) => ({
    date: formatShortDate(c.checkinDate),
    mood: c.moodScore,
  }))

  const triggerFreq = useMemo(() => {
    const counts: Record<string, number> = {}
    checkins.slice(0, 14).forEach((c) =>
      c.triggers.forEach((t) => {
        counts[t] = (counts[t] ?? 0) + 1
      })
    )
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t, count]) => ({ trigger: TRIGGER_LABELS[t as keyof typeof TRIGGER_LABELS] ?? t, count }))
  }, [checkins])

  const scatterSleep = checkins.slice(0, 14).map((c) => ({
    sleep: c.sleepHours,
    mood: c.moodScore,
    date: c.checkinDate,
  }))

  const scatterStudy = checkins.slice(0, 14).map((c) => ({
    study: c.studyHours,
    anxiety: c.anxietyLevel,
    date: c.checkinDate,
  }))

  async function generateWeeklyInsight() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/weekly-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkins: weekCheckins }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? 'Could not generate insight', 'error')
        return
      }
      const week = data.insight?.weekOf ?? currentWeek
      showToast('Weekly insight generated', 'success')
      router.push(`/insights/chat?week=${week}`)
    } catch {
      showToast('Could not generate insight — check connection', 'error')
    }
    setGenerating(false)
  }

  const peakDay = weekCheckins.reduce(
    (best, c) => (!best || c.moodScore > best.moodScore ? c : best),
    null as (typeof weekCheckins)[0] | null
  )

  const topTrigger = triggerFreq[0]?.trigger

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container">
          <TopBar title="Insights" />
          <InlineLoader label="Loading insights…" />
        </div>
      </AppShell>
    )
  }

  if (checkins.length < 3) {
    return (
      <AppShell>
        <div className="page-container space-y-4">
          <TopBar title="Insights" />
          <RecentDaysPicker checkins={checkins} />
          <div className="card py-8 text-center">
            <p className="text-ink">Keep checking in — insights unlock after 3 entries.</p>
            <p className="mt-2 text-sm text-ink-subtle">{checkins.length}/3 check-ins so far</p>
            <p className="mt-4 text-xs text-ink-subtle">
              Use the day picker above to add entries for the last 4 days, then come back here to
              generate your weekly AI insight.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const score = burnout?.score ?? 0
  const gaugeColor =
    score <= 40 ? '#27a644' : score <= 65 ? '#d97706' : score <= 85 ? '#e11d48' : '#991b1b'

  return (
    <AppShell>
      <div className="page-container space-y-6">
        <TopBar title="Insights" />
        <RecentDaysPicker checkins={checkins} />

        <div className="card text-center">
          <p className="text-sm text-ink-subtle">Burnout score</p>
          {burnoutLoading ? (
            <InlineLoader label="Calculating burnout score…" />
          ) : (
            <>
              <div className="relative mx-auto my-4 h-32 w-48">
            <svg viewBox="0 0 200 120" className="h-full w-full">
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#23252a"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 251} 251`}
              />
            </svg>
            <p className="absolute inset-x-0 bottom-2 text-3xl font-semibold" style={{ color: gaugeColor }}>
              {score}
            </p>
          </div>
          <p className="capitalize text-ink-muted">{burnout?.risk ?? 'low'} risk</p>
          <button
            type="button"
            onClick={() => setShowExplain(!showExplain)}
            className="mt-2 text-xs text-primary"
          >
            What is this?
          </button>
          {showExplain && (
            <p className="mt-2 text-left text-xs text-ink-subtle">
              Burnout score combines anxiety, low mood days, study hours, sleep, and mood streaks from
              your last 7 check-ins. It&apos;s a guide, not a diagnosis.
            </p>
          )}
          {burnout?.factors?.length ? (
            <ul className="mt-3 space-y-1 text-left text-xs text-ink-subtle">
              {burnout.factors.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          ) : null}
            </>
          )}
        </div>

        <div className="card">
          <p className="mb-3 text-sm font-medium">This week</p>
          <ul className="space-y-1 text-sm text-ink-muted">
            <li>You checked in {weekCheckins.length} times this week</li>
            {peakDay && <li>Mood peaked on {formatShortDate(peakDay.checkinDate)}</li>}
            {topTrigger && <li>Most common stressor: {topTrigger}</li>}
            <li>Avg sleep: {avg(weekCheckins.map((c) => c.sleepHours)).toFixed(1)} hrs</li>
          </ul>
        </div>

        {moodTrend.length > 0 && (
          <ChartCard title="7-day mood trend">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={moodTrend}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#23252a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} hide />
                <Tooltip contentStyle={{ background: '#141516', border: '1px solid #23252a', borderRadius: 8 }} />
                <Area type="monotone" dataKey="mood" stroke="#5e6ad2" fill="url(#moodGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {triggerFreq.length > 0 && (
          <ChartCard title="Top triggers (14 days)">
            <ResponsiveContainer width="100%" height={triggerFreq.length * 36 + 20}>
              <BarChart data={triggerFreq} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="trigger" width={120} tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {checkins.length >= 7 && scatterSleep.length > 0 && (
          <ChartCard title="Sleep vs mood">
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid stroke="#23252a" />
                <XAxis type="number" dataKey="sleep" name="Sleep" tick={{ fill: '#8a8f98', fontSize: 11 }} />
                <YAxis type="number" dataKey="mood" name="Mood" domain={[0, 5]} tick={{ fill: '#8a8f98', fontSize: 11 }} />
                <ZAxis range={[60, 60]} />
                <Tooltip contentStyle={{ background: '#141516', border: '1px solid #23252a' }} />
                <Scatter data={scatterSleep} fill="#5e6ad2" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {scatterStudy.length > 0 && (
          <ChartCard title="Study vs anxiety">
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid stroke="#23252a" />
                <XAxis type="number" dataKey="study" tick={{ fill: '#8a8f98', fontSize: 11 }} />
                <YAxis type="number" dataKey="anxiety" domain={[0, 5]} tick={{ fill: '#8a8f98', fontSize: 11 }} />
                <ZAxis range={[60, 60]} />
                <Scatter data={scatterStudy} fill="#d97706" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <div className="card">
          <LoadingButton
            loading={generating}
            loadingText="Generating…"
            disabled={weekCheckins.length === 0}
            onClick={generateWeeklyInsight}
            className="w-full"
          >
            Generate AI insight for this week
          </LoadingButton>
          {currentWeekInsight?.recommendations?.length ? (
            <div className="mt-4 space-y-3">
              {currentWeekInsight.recommendations.map((rec, i) => (
                <div key={i} className="rounded-lg border border-hairline bg-surface-2 p-3 text-sm text-ink-muted">
                  {rec}
                </div>
              ))}
              <Link
                href={`/insights/chat?week=${currentWeek}`}
                className="btn-secondary mt-2 block w-full text-center"
              >
                Chat about this week&apos;s insight
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p className="mb-3 text-sm font-medium text-ink">{title}</p>
      {children}
    </div>
  )
}
