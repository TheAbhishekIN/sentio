'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { MOOD_EMOJIS } from '@/lib/constants'
import { AFFIRMATIONS, RELAXATION_STEPS } from '@/lib/constants'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { vibrate, cn } from '@/lib/utils'
import { InlineLoader } from '@/components/ui/LoadingOverlay'
import { LoadingButton } from '@/components/ui/LoadingButton'

const GROUNDING_STEPS = [
  { sense: 'See', count: 5, prompt: 'Name 5 things you can see', color: 'from-sky-500/20' },
  { sense: 'Touch', count: 4, prompt: 'Name 4 things you can touch', color: 'from-amber-500/20' },
  { sense: 'Hear', count: 3, prompt: 'Name 3 things you can hear', color: 'from-primary/20' },
  { sense: 'Smell', count: 2, prompt: 'Name 2 things you can smell', color: 'from-green-500/20' },
  { sense: 'Taste', count: 1, prompt: 'Name 1 thing you can taste', color: 'from-purple-500/20' },
]

export default function ToolPage({ params }: { params: { toolId: string } }) {
  const { toolId } = params

  return (
    <AppShell>
      <div className="page-container">
        {toolId === 'breathing' && <BreathingTool />}
        {toolId === 'grounding' && <GroundingTool />}
        {toolId === 'break-timer' && <BreakTimerTool />}
        {toolId === 'anchor' && <AnchorTool />}
        {toolId === 'relax' && <RelaxTool />}
        {toolId === 'affirmations' && <AffirmationsTool />}
        {toolId === 'sos' && <SosTool />}
        {toolId === 'helplines' && <HelplinesTool />}
        {!['breathing', 'grounding', 'break-timer', 'anchor', 'relax', 'affirmations', 'sos', 'helplines'].includes(toolId) && (
          <>
            <TopBar title="Tool not found" backHref="/toolkit" />
            <p className="text-ink-subtle">This tool does not exist.</p>
          </>
        )}
      </div>
    </AppShell>
  )
}

async function saveSession(toolId: string, durationSecs: number, moodBefore?: number, moodAfter?: number) {
  await fetch('/api/coping/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, durationSecs, moodBefore, moodAfter }),
  })
}

function MoodAfterPrompt({
  toolId,
  durationSecs,
}: {
  toolId: string
  durationSecs: number
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSelect(mood: number) {
    vibrate()
    setSaving(true)
    try {
      await saveSession(toolId, durationSecs, undefined, mood)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mt-6 text-center">
        <p className="text-ink-muted">Session saved ✓</p>
      </div>
    )
  }

  if (saving) {
    return <InlineLoader label="Saving session…" className="mt-6" />
  }

  return (
    <div className="mt-6 text-center">
      <p className="mb-4 text-ink">How do you feel now?</p>
      <div className="flex justify-center gap-3">
        {([1, 2, 3, 4, 5] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-label={`Mood ${m}`}
            onClick={() => handleSelect(m)}
            className="text-2xl transition-transform hover:scale-110"
          >
            {MOOD_EMOJIS[m]}
          </button>
        ))}
      </div>
    </div>
  )
}

function BreathingTool() {
  const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const
  const [rounds, setRounds] = useState(5)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [countdown, setCountdown] = useState(4)
  const [round, setRound] = useState(1)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!running || done) return
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhaseIdx((p) => {
            const next = (p + 1) % 4
            if (next === 0) {
              setRound((r) => {
                if (r >= rounds) {
                  setRunning(false)
                  setDone(true)
                  return r
                }
                return r + 1
              })
            }
            return next
          })
          return 4
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, done, rounds])

  const phase = phases[phaseIdx]
  const scale = phase === 'Inhale' ? 1.3 : phase === 'Exhale' ? 1 : 1.15

  return (
    <>
      <TopBar title="Box Breathing" backHref="/toolkit" />
      {!running && !done && (
        <div className="mb-6 flex justify-center gap-2">
          {[3, 5, 7].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRounds(r)}
              className={cn('chip', rounds === r && 'chip-selected')}
            >
              {r} rounds
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col items-center py-8">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full border-4 transition-all duration-1000"
          style={{
            borderColor: phaseIdx % 2 === 0 ? '#5e6ad2' : '#828fff',
            transform: running ? `scale(${scale})` : 'scale(1)',
          }}
        >
          {running || done ? (
            <div className="text-center">
              <p className="text-lg font-medium text-ink">{done ? 'Complete!' : phase}</p>
              {!done && <p className="text-3xl font-semibold text-primary">{countdown}</p>}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">4-4-4-4</p>
          )}
        </div>
        {running && <p className="mt-4 text-sm text-ink-subtle">Round {round} of {rounds}</p>}
        {!running && !done && (
          <button
            type="button"
            onClick={() => {
              startTime.current = Date.now()
              setRunning(true)
            }}
            className="btn-primary mt-8"
          >
            Start
          </button>
        )}
        {done && (
          <MoodAfterPrompt
            toolId="breathing"
            durationSecs={Math.round((Date.now() - startTime.current) / 1000)}
          />
        )}
      </div>
    </>
  )
}

function GroundingTool() {
  const [step, setStep] = useState(0)
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', ''])
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())
  const current = GROUNDING_STEPS[step]

  return (
    <>
      <TopBar title="5-4-3-2-1 Grounding" backHref="/toolkit" />
      {!done ? (
        <div className={cn('card bg-gradient-to-br to-surface-1', current.color)}>
          <p className="text-xs uppercase tracking-wider text-primary">{current.sense}</p>
          <p className="mt-2 text-lg text-ink">{current.prompt}</p>
          <textarea
            className="input mt-4 min-h-[80px]"
            value={inputs[step]}
            onChange={(e) => {
              const next = [...inputs]
              next[step] = e.target.value
              setInputs(next)
            }}
            placeholder={`List ${current.count}…`}
          />
          <button
            type="button"
            onClick={() => {
              if (step < 4) setStep(step + 1)
              else setDone(true)
            }}
            className="btn-primary mt-4 w-full"
          >
            {step < 4 ? 'Next →' : 'Complete'}
          </button>
        </div>
      ) : (
        <MoodAfterPrompt
          toolId="grounding"
          durationSecs={Math.round((Date.now() - startTime.current) / 1000)}
        />
      )}
    </>
  )
}

function BreakTimerTool() {
  const presets = [
    { label: '25+5', study: 25, brk: 5 },
    { label: '45+10', study: 45, brk: 10 },
    { label: '90+20', study: 90, brk: 20 },
  ]
  const [preset, setPreset] = useState(presets[0])
  const [phase, setPhase] = useState<'study' | 'break'>('study')
  const [seconds, setSeconds] = useState(preset.study * 60)
  const [running, setRunning] = useState(false)
  const [pomodoros, setPomodoros] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            osc.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.3)
          } catch {}
          if (phase === 'study') {
            setPhase('break')
            setPomodoros((p) => p + 1)
            return preset.brk * 60
          }
          setPhase('study')
          return preset.study * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, phase, preset])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <>
      <TopBar title="Study Break Timer" backHref="/toolkit" />
      <div className="mb-4 flex gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setPreset(p)
              setSeconds(p.study * 60)
              setPhase('study')
              setRunning(false)
            }}
            className={cn('chip', preset.label === p.label && 'chip-selected')}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="card flex flex-col items-center py-10">
        <p className="text-sm capitalize text-ink-subtle">{phase} time</p>
        <p className="mt-2 text-5xl font-semibold tabular-nums text-ink">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </p>
        <p className="mt-4 text-sm text-ink-subtle">Today: {pomodoros} pomodoros</p>
        <button type="button" onClick={() => setRunning(!running)} className="btn-primary mt-6">
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </>
  )
}

function AnchorTool() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.motivationalAnchor) setText(profile.motivationalAnchor)
  }, [profile?.motivationalAnchor])

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        motivationalAnchor: text,
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="Motivational Anchor" backHref="/toolkit" />
      {saved || profile?.motivationalAnchor ? (
        <blockquote className="card py-8 text-center text-xl font-medium italic leading-relaxed text-ink">
          &ldquo;{text || profile?.motivationalAnchor}&rdquo;
        </blockquote>
      ) : null}
      <label className="mt-4 block text-sm text-ink-muted">
        Why are you working this hard?
        <textarea
          className="input mt-2 min-h-[120px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your why…"
        />
      </label>
      <LoadingButton
        loading={saving}
        loadingText="Saving…"
        onClick={save}
        className="mt-4 w-full"
      >
        Save anchor
      </LoadingButton>
    </>
  )
}

function RelaxTool() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())

  return (
    <>
      <TopBar title="Progressive Relaxation" backHref="/toolkit" />
      {!done ? (
        <div className="card">
          <p className="text-sm text-ink-subtle">
            Step {step + 1} of {RELAXATION_STEPS.length}
          </p>
          <p className="mt-4 text-lg text-ink">{RELAXATION_STEPS[step]}</p>
          <button
            type="button"
            onClick={() => {
              if (step < RELAXATION_STEPS.length - 1) setStep(step + 1)
              else setDone(true)
            }}
            className="btn-primary mt-6 w-full"
          >
            {step < RELAXATION_STEPS.length - 1 ? 'Next →' : 'Finish'}
          </button>
        </div>
      ) : (
        <MoodAfterPrompt
          toolId="relax"
          durationSecs={Math.round((Date.now() - startTime.current) / 1000)}
        />
      )}
    </>
  )
}

function AffirmationsTool() {
  const [idx, setIdx] = useState(0)

  return (
    <>
      <TopBar title="Exam Affirmations" backHref="/toolkit" />
      <div className="card py-10 text-center">
        <p className="text-lg leading-relaxed text-ink">{AFFIRMATIONS[idx]}</p>
        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length)}
            className="btn-secondary flex-1"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % AFFIRMATIONS.length)}
            className="btn-primary flex-1"
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}

function SosTool() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())
  const steps = [
    'Place both feet flat on the ground. Feel the floor supporting you.',
    'Take a slow breath in for 4 counts. Hold for 2. Exhale for 6.',
    'Name 3 objects you can see right now. Say them out loud if you can.',
  ]

  function handleNext() {
    vibrate()
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas/95 px-4 py-8">
      <TopBar title="Panic SOS" backHref="/toolkit" />
      {!done ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8 h-32 w-32 animate-[breathe-in_4s_ease-in-out_infinite] rounded-full border-4 border-primary/50" />
            <p className="text-xs text-ink-subtle">
              Step {step + 1} of {steps.length}
            </p>
            <p className="mt-2 max-w-sm text-lg text-ink">{steps[step]}</p>
            <button type="button" onClick={handleNext} className="btn-primary mt-8">
              {step < steps.length - 1 ? 'Next step' : 'I feel a bit better'}
            </button>
          </div>
          <div className="space-y-2 text-center text-sm text-ink-subtle">
            <a href="tel:9152987821" className="btn-secondary block">
              iCall: 9152987821
            </a>
            <a href="tel:18602662345" className="btn-secondary block">
              Vandrevala: 1860-2662-345
            </a>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-5xl">💜</p>
          <h2 className="mt-4 text-xl font-semibold text-ink">You did great</h2>
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            Pausing to breathe takes courage. It&apos;s okay if you still feel shaken — that&apos;s
            normal.
          </p>
          <MoodAfterPrompt
            toolId="sos"
            durationSecs={Math.round((Date.now() - startTime.current) / 1000)}
          />
          <Link href="/toolkit" className="btn-tertiary mt-6">
            Back to toolkit
          </Link>
        </div>
      )}
    </div>
  )
}

function HelplinesTool() {
  const lines = [
    { name: 'iCall (TISS)', number: '9152987821', hours: 'Mon–Sat 8am–10pm', free: true },
    { name: 'Vandrevala Foundation', number: '18602662345', hours: '24×7', free: true },
    { name: 'NIMHANS', number: '08046110007', hours: '24×7', free: true },
  ]

  return (
    <>
      <TopBar title="Helplines" backHref="/toolkit" />
      <p className="-mt-4 mb-4 text-sm text-ink-subtle">
        Real helplines. Trained counsellors. Free.
      </p>
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.name} className="card">
            <p className="font-medium text-ink">{line.name}</p>
            <p className="text-sm text-ink-subtle">{line.hours} · Free</p>
            <a href={`tel:${line.number}`} className="btn-primary mt-3 inline-flex">
              Call now
            </a>
          </div>
        ))}
      </div>
    </>
  )
}
