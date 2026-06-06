'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { RecentDaysPicker } from '@/components/checkin/RecentDaysPicker'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useAllCheckins, useTodayCheckin } from '@/hooks/useCheckin'
import { ALL_TRIGGERS, MOOD_EMOJIS, MOOD_LABELS, TRIGGER_LABELS } from '@/lib/constants'
import { getJournalPrompt } from '@/lib/prompts'
import { formatShortDate, relativeDayLabel, todayISO, vibrate } from '@/lib/utils'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useToast } from '@/components/ui/Toast'
import type { CheckinFormData } from '@/lib/types'
import { cn } from '@/lib/utils'

const defaultForm: CheckinFormData = {
  moodScore: 3,
  energyLevel: 3,
  anxietyLevel: 3,
  triggers: [],
  journalEntry: '',
  studyHours: 6,
  sleepHours: 7,
}

function CheckinWizard() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const dateParam = searchParams.get('date') ?? searchParams.get('edit')
  const targetDate = dateParam ?? todayISO()
  const isToday = targetDate === todayISO()

  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: allCheckins = [] } = useAllCheckins(user?.id)
  const { data: existing, refetch } = useTodayCheckin(user?.id, targetDate)
  const { showToast } = useToast()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CheckinFormData>(defaultForm)
  const [showGratitude, setShowGratitude] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ streakCount: number; aiReflection?: string | null } | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    setStep(0)
    setDone(false)
    setEditMode(false)
    setShowGratitude(false)
    setForm(defaultForm)
    setResult(null)
  }, [targetDate])

  useEffect(() => {
    if (existing && editMode) {
      setForm({
        moodScore: existing.moodScore,
        energyLevel: existing.energyLevel,
        anxietyLevel: existing.anxietyLevel,
        triggers: existing.triggers,
        journalEntry: existing.journalEntry,
        gratitudeNote: existing.gratitudeNote ?? undefined,
        studyHours: existing.studyHours,
        sleepHours: existing.sleepHours,
      })
      if (existing.gratitudeNote) setShowGratitude(true)
    }
  }, [existing, editMode])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/checkin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, checkinDate: targetDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult({ streakCount: data.streakCount, aiReflection: data.aiReflection })
      setDone(true)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['checkins-all', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['checkins', user?.id] })

      if (form.moodScore >= 4) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
      }
      showToast('Check-in saved!', 'success')
    } catch {
      showToast("Couldn't save — check connection", 'error')
    }
    setSaving(false)
  }

  if (existing && !editMode && !done) {
    return (
      <div className="page-container space-y-4">
        <TopBar title="Check-in" backHref="/dashboard" />
        <RecentDaysPicker checkins={allCheckins} selectedDate={targetDate} />
        <div className="card py-10 text-center">
          <p className="text-xs uppercase tracking-wider text-ink-subtle">
            {relativeDayLabel(targetDate)} · {formatShortDate(targetDate)}
          </p>
          <p className="mt-2 text-4xl">{MOOD_EMOJIS[existing.moodScore]}</p>
          <p className="mt-3 text-lg text-ink">
            {isToday ? 'Already checked in today' : 'Check-in saved for this day'}
          </p>
          <p className="mt-1 text-sm text-ink-subtle">
            {MOOD_LABELS[existing.moodScore]} · {existing.journalEntry.slice(0, 60)}
            {existing.journalEntry.length > 60 ? '…' : ''}
          </p>
          {existing.aiReflection && (
            <div className="mt-4 rounded-lg border border-hairline border-l-4 border-l-primary bg-surface-2 p-3 text-left text-sm text-ink-muted">
              {existing.aiReflection}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={() => setEditMode(true)} className="btn-secondary">
              Edit this check-in
            </button>
            <Link href={`/journal/${targetDate}`} className="btn-tertiary">
              View journal entry
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (done && result) {
    return (
      <div className="page-container space-y-4 text-center">
        <RecentDaysPicker checkins={allCheckins} selectedDate={targetDate} />
        <div>
          <p className="text-xs text-ink-subtle">
            {relativeDayLabel(targetDate)} · {formatShortDate(targetDate)}
          </p>
          <div className={form.moodScore <= 2 ? 'animate-pulse-heart mt-2 text-5xl' : 'mt-2 text-5xl'}>
            {form.moodScore <= 2 ? '💜' : '✓'}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink">Check-in complete</h2>
          <p className="mt-2 text-ink-muted">🔥 {result.streakCount} day streak</p>

          {profile?.aiEnabled && (
            <div className="card mt-6 border-l-4 border-l-primary text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Wellness Companion
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {result.aiReflection || 'Unavailable right now — your check-in is saved.'}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2">
            <Link href="/insights" className="btn-primary">
              View insights →
            </Link>
            <Link href="/toolkit/breathing" className="btn-secondary">
              Try coping exercise →
            </Link>
            <Link href="/dashboard" className="btn-tertiary">
              Go home →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle = editMode
    ? `Edit · ${formatShortDate(targetDate)}`
    : isToday
      ? 'Check-in'
      : `Check-in · ${formatShortDate(targetDate)}`

  const totalSteps = 5
  const journalPrompt = getJournalPrompt(form.moodScore, profile?.phase ?? 'preparation')

  return (
    <div className="page-container space-y-4">
      <LoadingOverlay
        show={saving}
        label={profile?.aiEnabled ? 'Saving & generating reflection…' : 'Saving check-in…'}
      />
      <TopBar title={pageTitle} backHref="/dashboard" />
      <RecentDaysPicker checkins={allCheckins} selectedDate={targetDate} />
      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 0 && (
            <div className="text-center">
              <p className="mb-6 text-lg text-ink">How are you feeling right now?</p>
              <div className="flex flex-wrap justify-center gap-4">
                {([1, 2, 3, 4, 5] as const).map((score) => (
                  <button
                    key={score}
                    type="button"
                    aria-label={MOOD_LABELS[score]}
                    onClick={() => {
                      vibrate()
                      setForm((f) => ({ ...f, moodScore: score }))
                      setTimeout(() => setStep(1), 400)
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline bg-surface-1 text-3xl transition-transform hover:scale-110 active:scale-125"
                  >
                    {MOOD_EMOJIS[score]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <SliderField
                label="How's your energy?"
                value={form.energyLevel}
                onChange={(v) =>
                  setForm((f) => ({ ...f, energyLevel: v as CheckinFormData['energyLevel'] }))
                }
                minLabel="🪫"
                maxLabel="⚡"
              />
              <SliderField
                label="How anxious are you?"
                value={form.anxietyLevel}
                onChange={(v) =>
                  setForm((f) => ({ ...f, anxietyLevel: v as CheckinFormData['anxietyLevel'] }))
                }
                minLabel="😌"
                maxLabel="😰"
              />
              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4 text-lg text-ink">What&apos;s weighing on you today?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, triggers: [] }))}
                  className={cn('chip', form.triggers.length === 0 && 'chip-selected')}
                >
                  Nothing specific today
                </button>
                {ALL_TRIGGERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      vibrate()
                      setForm((f) => ({
                        ...f,
                        triggers: f.triggers.includes(t)
                          ? f.triggers.filter((x) => x !== t)
                          : [...f.triggers, t],
                      }))
                    }}
                    className={cn('chip', form.triggers.includes(t) && 'chip-selected')}
                  >
                    {TRIGGER_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  Next →
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-tertiary">
                  Skip
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepperField
                label="Study hours"
                value={form.studyHours}
                onChange={(v) => setForm((f) => ({ ...f, studyHours: v }))}
                min={0}
                max={16}
                step={0.5}
              />
              <StepperField
                label="Sleep hours"
                value={form.sleepHours}
                onChange={(v) => setForm((f) => ({ ...f, sleepHours: v }))}
                min={0}
                max={12}
                step={0.5}
              />
              <button type="button" onClick={() => setStep(4)} className="btn-primary w-full">
                Next →
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-3 text-sm text-ink-muted">{journalPrompt}</p>
              <textarea
                className="input min-h-[120px] resize-y"
                rows={4}
                value={form.journalEntry}
                onChange={(e) => setForm((f) => ({ ...f, journalEntry: e.target.value }))}
                placeholder="Write freely…"
              />
              {!showGratitude ? (
                <button
                  type="button"
                  onClick={() => setShowGratitude(true)}
                  className="mt-2 text-sm text-primary"
                >
                  + Add a gratitude note
                </button>
              ) : (
                <textarea
                  className="input mt-3 min-h-[60px]"
                  placeholder="One thing you're grateful for…"
                  value={form.gratitudeNote ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, gratitudeNote: e.target.value }))}
                />
              )}
              <LoadingButton
                loading={saving}
                loadingText="Saving…"
                onClick={save}
                className="mt-6 w-full"
              >
                Save check-in ✓
              </LoadingButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && step < 4 && (
        <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-tertiary mt-4">
          ← Back
        </button>
      )}
    </div>
  )
}

export default function CheckinPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="page-container">
            <div className="h-64 animate-pulse rounded-lg bg-surface-1" />
          </div>
        }
      >
        <CheckinWizard />
      </Suspense>
    </AppShell>
  )
}

function SliderField({
  label,
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  minLabel: string
  maxLabel: string
}) {
  return (
    <div>
      <p className="mb-3 text-ink">{label}</p>
      <div className="flex items-center gap-3">
        <span>{minLabel}</span>
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-primary"
          aria-label={label}
        />
        <span>{maxLabel}</span>
      </div>
      <p className="mt-1 text-center text-sm text-ink-subtle">{value}/5</p>
    </div>
  )
}

function StepperField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 p-4">
      <span className="text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-2"
        >
          −
        </button>
        <span className="min-w-[3rem] text-center font-medium">{value}h</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline bg-surface-2"
        >
          +
        </button>
      </div>
    </div>
  )
}
