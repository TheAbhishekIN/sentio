'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth, getUserDisplayName } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { EXAM_TYPES, PHASE_COPY } from '@/lib/constants'
import { computePhase, daysUntil, vibrate } from '@/lib/utils'
import type { ExamType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [exam, setExam] = useState<ExamType>('JEE')
  const [targetCollege, setTargetCollege] = useState('')
  const [examDate, setExamDate] = useState('')
  const [isResultWait, setIsResultWait] = useState(false)
  const [name, setName] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
    if (!profileLoading && profile?.onboardingComplete) router.replace('/dashboard')
  }, [user, authLoading, profile, profileLoading, router])

  useEffect(() => {
    const fromProfile = profile?.name?.trim()
    const fromAuth = getUserDisplayName(user)
    if (fromProfile) setName(fromProfile)
    else if (fromAuth) setName(fromAuth)
  }, [profile?.name, user])

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-1" />
      </div>
    )
  }

  const phase = isResultWait ? 'result_wait' : computePhase(examDate || null)
  const days = daysUntil(examDate || null)

  async function finish() {
    if (!user) return
    setLoading(true)

    try {
      const { createClient } = await import('@/utils/supabase/client')
      const { upsertProfile } = await import('@/lib/db/profiles')
      const supabase = createClient()

      await upsertProfile(supabase, {
        id: user.id,
        name,
        exam,
        examDate: examDate || null,
        phase,
        targetCollege: targetCollege || null,
        aiEnabled,
        onboardingComplete: true,
        streakCount: 0,
        totalCheckins: 0,
        lastCheckinDate: null,
      })

      router.push('/dashboard')
    } catch {
      setLoading(false)
    }
  }

  const slides = [
    <WelcomeSlide key="welcome" onNext={() => setStep(1)} />,
    <FeaturesSlide key="features" onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <ExamSlide
      key="exam"
      exam={exam}
      setExam={setExam}
      targetCollege={targetCollege}
      setTargetCollege={setTargetCollege}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
    />,
    <DateSlide
      key="date"
      examDate={examDate}
      setExamDate={setExamDate}
      isResultWait={isResultWait}
      setIsResultWait={setIsResultWait}
      phase={phase}
      onNext={() => setStep(4)}
      onBack={() => setStep(2)}
    />,
    <FinalSlide
      key="final"
      name={name}
      setName={setName}
      aiEnabled={aiEnabled}
      setAiEnabled={setAiEnabled}
      exam={exam}
      phase={phase}
      days={days}
      loading={loading}
      onFinish={finish}
      onBack={() => setStep(3)}
    />,
  ]

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <LoadingOverlay show={loading} label="Setting up your profile…" />
      <div className="mx-auto w-full max-w-md flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {slides[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto flex gap-2 pb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-hairline')}
          />
        ))}
      </div>
    </div>
  )
}

function WelcomeSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-center text-center">
      <div className="mb-6 flex justify-center gap-4 text-3xl">
        {['😔', '😐', '🙂', '😄'].map((e, i) => (
          <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
            {e}
          </span>
        ))}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Your mind matters as much as your marks.
      </h1>
      <p className="mt-3 text-ink-muted">
        A daily check-in companion for students navigating exam pressure.
      </p>
      <button type="button" onClick={onNext} className="btn-primary mx-auto mt-8">
        Let&apos;s begin →
      </button>
    </div>
  )
}

function FeaturesSlide({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const features = [
    { icon: '🎯', title: 'Track your mood daily', desc: '30 seconds' },
    { icon: '🔥', title: 'Spot stress triggers', desc: 'Know your patterns' },
    { icon: '📓', title: 'Journal with prompts', desc: 'Guided reflection' },
    { icon: '📊', title: 'Understand patterns', desc: 'Weekly insights' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">What Sentio does</h2>
      <p className="mt-2 text-sm text-ink-subtle">Your data stays private in your account.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {features.map((f) => (
          <div key={f.title} className="card p-4">
            <span className="text-2xl">{f.icon}</span>
            <p className="mt-2 text-sm font-medium text-ink">{f.title}</p>
            <p className="text-xs text-ink-subtle">{f.desc}</p>
          </div>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  )
}

function ExamSlide({
  exam,
  setExam,
  targetCollege,
  setTargetCollege,
  onNext,
  onBack,
}: {
  exam: ExamType
  setExam: (e: ExamType) => void
  targetCollege: string
  setTargetCollege: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">Your exam</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAM_TYPES.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              vibrate()
              setExam(e)
            }}
            className={cn('chip', exam === e && 'chip-selected')}
          >
            {e}
          </button>
        ))}
      </div>
      <label className="mt-6 block text-sm text-ink-muted">
        Target college or rank (optional)
        <input
          className="input mt-1.5"
          value={targetCollege}
          onChange={(ev) => setTargetCollege(ev.target.value)}
          placeholder="e.g. IIT Bombay, AIR 500"
        />
      </label>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  )
}

function DateSlide({
  examDate,
  setExamDate,
  isResultWait,
  setIsResultWait,
  phase,
  onNext,
  onBack,
}: {
  examDate: string
  setExamDate: (v: string) => void
  isResultWait: boolean
  setIsResultWait: (v: boolean) => void
  phase: string
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">Exam timeline</h2>
      <label className="mt-4 block text-sm text-ink-muted">
        Exam date
        <input
          type="date"
          className="input mt-1.5"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          disabled={isResultWait}
        />
      </label>
      <label className="mt-4 flex items-center gap-3 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isResultWait}
          onChange={(e) => setIsResultWait(e.target.checked)}
          className="h-4 w-4 rounded border-hairline"
        />
        Already appeared / Waiting for result
      </label>
      <div className="mt-4 rounded-lg border border-hairline bg-surface-1 p-4">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-primary">
          {phase.replace('_', ' ')}
        </span>
        <p className="mt-2 text-sm text-ink-muted">
          {PHASE_COPY[phase as keyof typeof PHASE_COPY]}
        </p>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  )
}

function FinalSlide({
  name,
  setName,
  aiEnabled,
  setAiEnabled,
  exam,
  phase,
  days,
  loading,
  onFinish,
  onBack,
}: {
  name: string
  setName: (v: string) => void
  aiEnabled: boolean
  setAiEnabled: (v: boolean) => void
  exam: string
  phase: string
  days: number | null
  loading: boolean
  onFinish: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">Almost done</h2>
      <label className="mt-4 block text-sm text-ink-muted">
        What should we call you?
        <input
          className="input mt-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </label>
      <label className="mt-4 flex items-start gap-3 rounded-lg border border-hairline bg-surface-1 p-4">
        <input
          type="checkbox"
          checked={aiEnabled}
          onChange={(e) => setAiEnabled(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <div>
          <p className="text-sm font-medium text-ink">Enable AI reflections</p>
          <p className="text-xs text-ink-subtle">
            Uses Google Gemini. No data sold. Journal sent only for that request.
          </p>
        </div>
      </label>
      <div className="card mt-4 text-sm">
        <p>
          <span className="text-ink-subtle">Exam:</span> {exam}
        </p>
        <p>
          <span className="text-ink-subtle">Phase:</span> {phase.replace('_', ' ')}
        </p>
        {days !== null && days >= 0 && (
          <p>
            <span className="text-ink-subtle">Days to go:</span> {days}
          </p>
        )}
      </div>
      <NavButtons
        onBack={onBack}
        onNext={onFinish}
        nextLabel="Start tracking →"
        disabled={!name.trim()}
        loading={loading}
      />
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next →',
  disabled,
  loading,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="mt-8 flex gap-3">
      <button type="button" onClick={onBack} disabled={loading} className="btn-secondary flex-1">
        Back
      </button>
      <LoadingButton
        loading={loading}
        loadingText="Saving…"
        onClick={onNext}
        disabled={disabled}
        className="flex-1"
      >
        {nextLabel}
      </LoadingButton>
    </div>
  )
}
