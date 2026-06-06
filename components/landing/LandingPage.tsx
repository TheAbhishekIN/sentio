import Link from 'next/link'
import {
  Activity,
  Anchor,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarCheck,
  ChevronRight,
  Flame,
  Heart,
  LineChart,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
  Target,
  Wind,
} from 'lucide-react'
import {
  EXAM_TYPES,
  MOOD_COLORS,
  MOOD_EMOJIS,
  PHASE_LABELS,
  TOOLKIT_TOOLS,
  TRIGGER_LABELS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

type LandingPageProps = {
  ctaHref: string
  ctaLabel: string
  isLoggedIn: boolean
}

const FEATURE_SECTIONS = [
  {
    id: 'checkin',
    eyebrow: 'Daily check-in',
    title: 'A 2-minute ritual that actually fits exam life',
    description:
      'Log mood, energy, and anxiety on a simple 5-point scale. Tag what stressed you — mock scores, sleep, comparison, syllabus overload — and capture sleep and study hours in one flow.',
    bullets: [
      'Step-by-step wizard with phase-aware journal prompts',
      'Backfill the last 4 days so insights unlock faster',
      'Optional gratitude note and confetti on save',
      'Edit any past day without breaking your streak logic',
    ],
    icon: CalendarCheck,
    accent: 'from-amber-500/20',
  },
  {
    id: 'ai',
    eyebrow: 'AI wellness coach',
    title: 'Reflections that read your journal, not a textbook',
    description:
      'When AI is enabled, Sentio turns your check-in into a warm 2–3 sentence reflection — exam-aware, non-clinical, and under 70 words. Weekly, it synthesises your patterns into three actionable recommendations.',
    bullets: [
      'Journal reflections powered by Google Gemini (opt-in only)',
      'Weekly insight generation from your last 7 check-ins',
      'Insight chat: ask follow-ups about stress, sleep, and burnout',
      'Strict scope — wellness only, no homework answers',
    ],
    icon: Sparkles,
    accent: 'from-primary/25',
  },
  {
    id: 'insights',
    eyebrow: 'Insights & analytics',
    title: 'See patterns before they become burnout',
    description:
      'Unlock charts after 3 check-ins. Burnout score blends anxiety, low-mood days, study load, and sleep into a simple gauge with plain-language factors — a guide, not a diagnosis.',
    bullets: [
      'Burnout score with low / medium / high / critical risk',
      '7-day mood trend, top triggers, sleep vs mood scatter',
      'Study hours vs anxiety correlation chart',
      'Weekly summary: peak mood day, avg sleep, top stressor',
    ],
    icon: LineChart,
    accent: 'from-sky-500/20',
  },
  {
    id: 'toolkit',
    eyebrow: 'Coping toolkit',
    title: 'Eight tools for the moments between mocks',
    description:
      'Quick exercises when anxiety spikes — breathing, grounding, study breaks, affirmations, progressive relaxation, and panic SOS. Helplines for iCall, Vandrevala, and NIMHANS are one tap away.',
    bullets: TOOLKIT_TOOLS.map((t) => `${t.name} — ${t.description}`),
    icon: Wind,
    accent: 'from-indigo-900/40',
  },
  {
    id: 'journal',
    eyebrow: 'Journal & reflections',
    title: 'Every entry, searchable and filterable',
    description:
      'Browse your full history with filters for this week, month, or mood. Each day shows triggers, study and sleep stats, and any AI reflection you received.',
    bullets: [
      'Filter by time range or mood score',
      'Tap any day for the full journal entry',
      'AI reflections saved alongside your words',
      'Dashboard shortcut to today’s reflection',
    ],
    icon: BookOpen,
    accent: 'from-emerald-500/15',
  },
  {
    id: 'settings',
    eyebrow: 'Your profile & privacy',
    title: 'Built for JEE, NEET, and every exam in between',
    description:
      'Set your exam, target date, and phase-aware copy that adapts from preparation through exam week and result wait. Control AI, daily reminders, export, and account deletion.',
    bullets: [
      'Supports JEE, NEET, CUET, CAT, GATE, UPSC, Board & more',
      'Auto phase detection from exam date',
      'Daily browser notification reminders',
      'Export JSON or permanently delete your account',
    ],
    icon: Shield,
    accent: 'from-violet-500/15',
  },
] as const

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your account',
    body: 'Sign up in seconds. Onboarding asks your exam, timeline, and whether you want AI reflections.',
  },
  {
    step: '02',
    title: 'Check in daily',
    body: 'Rate mood, energy, and anxiety. Tag triggers, log sleep and study hours, and write a short journal.',
  },
  {
    step: '03',
    title: 'Unlock insights',
    body: 'After 3 entries, charts and burnout scoring activate. Generate a weekly AI insight when you are ready.',
  },
  {
    step: '04',
    title: 'Build habits',
    body: 'Use the toolkit, chat about your week, and keep your streak alive with gentle reminders.',
  },
] as const

export function LandingPage({ ctaHref, ctaLabel, isLoggedIn }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} isLoggedIn={isLoggedIn} />

      <main>
        <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} isLoggedIn={isLoggedIn} />
        <StatsStrip />
        <FeatureGrid />
        <MoodScale />
        <TriggerChips />
        <FeatureSections />
        <ExamPhases />
        <HowItWorks />
        <PrivacySection />
        <FinalCta ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>

      <LandingFooter />
    </div>
  )
}

function LandingNav({
  ctaHref,
  ctaLabel,
  isLoggedIn,
}: {
  ctaHref: string
  ctaLabel: string
  isLoggedIn: boolean
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="landing-container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 text-sm font-semibold text-primary">
            S
          </span>
          <span className="font-semibold tracking-tight">Sentio</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-subtle md:flex">
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#privacy" className="transition-colors hover:text-ink">
            Privacy
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {!isLoggedIn && (
            <Link href="/login" className="btn-tertiary hidden sm:inline-flex">
              Log in
            </Link>
          )}
          <Link href={ctaHref} className="btn-primary">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero({
  ctaHref,
  ctaLabel,
  isLoggedIn,
}: {
  ctaHref: string
  ctaLabel: string
  isLoggedIn: boolean
}) {
  return (
    <section className="landing-container relative overflow-hidden pb-16 pt-12 md:pb-24 md:pt-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-primary/15 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Mental wellness for exam prep</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
            Your mind matters as much as your marks.
          </h1>
          <p className="max-w-xl text-lg text-ink-muted">
            Sentio is a daily check-in companion for students navigating JEE, NEET, boards, and competitive exams in
            India — mood tracking, burnout insights, AI reflections, and coping tools in one calm app.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ctaHref} className="btn-primary px-5 py-2.5">
              {ctaLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
            {!isLoggedIn && (
              <Link href="/login" className="btn-secondary px-5 py-2.5">
                Log in
              </Link>
            )}
          </div>
          <p className="text-sm text-ink-subtle">Free to use · Private by default · AI is optional</p>
        </div>

        <div className="card relative overflow-hidden border-hairline-strong bg-gradient-to-br from-primary/10 via-surface-1 to-surface-2 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-subtle">Good evening, Aarav</p>
              <p className="font-medium">JEE · Intensive phase · 56 days left</p>
            </div>
            <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs text-ink-muted">
              🔥 12-day streak
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewCard icon={Heart} label="Today's mood" value="🙂 Good" />
            <PreviewCard icon={Activity} label="Burnout score" value="42 · medium" />
            <PreviewCard icon={Moon} label="Last night" value="6.5 hrs sleep" />
            <PreviewCard icon={Brain} label="AI reflection" value="Ready after journal" />
          </div>
          <div className="mt-6 rounded-lg border border-hairline bg-surface-2 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">This week</p>
            <p className="mt-2 text-sm text-ink-muted">
              &ldquo;Your sleep dipped mid-week — try a 10-minute wind-down before the next mock.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2 p-4">
      <div className="mb-2 flex items-center gap-2 text-ink-subtle">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function StatsStrip() {
  const stats = [
    { icon: CalendarCheck, label: 'Daily check-in wizard' },
    { icon: Sparkles, label: 'AI reflections & weekly insights' },
    { icon: BarChart3, label: 'Burnout score & charts' },
    { icon: Wind, label: '8 coping tools' },
    { icon: MessageCircle, label: 'Insight chat' },
    { icon: Bell, label: 'Daily reminders' },
  ]

  return (
    <section className="border-y border-hairline bg-surface-1/50 py-6">
      <div className="landing-container grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-sm text-ink-muted">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureGrid() {
  const highlights = [
    {
      icon: Flame,
      title: 'Streak tracking',
      description: 'Daily streaks with 7, 14, and 30-day milestones. Same-day edits keep your count intact.',
    },
    {
      icon: Target,
      title: 'Exam-aware phases',
      description: 'Copy and prompts shift from preparation through exam week, result wait, and beyond.',
    },
    {
      icon: LineChart,
      title: 'Visual analytics',
      description: 'Mood trends, trigger bars, and scatter plots for sleep, study, and anxiety.',
    },
    {
      icon: MessageCircle,
      title: 'Insight chat',
      description: 'Discuss your weekly recommendations — up to 10 focused messages per week.',
    },
    {
      icon: Anchor,
      title: 'Motivational anchor',
      description: 'Write your why and revisit it when self-doubt creeps in during prep.',
    },
    {
      icon: Shield,
      title: 'Data control',
      description: 'Export everything as JSON or delete your account permanently from Settings.',
    },
  ]

  return (
    <section id="features" className="landing-container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Everything in one place</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Built for the full emotional arc of exam prep
        </h2>
        <p className="mt-4 text-ink-muted">
          From daily mood logs to panic SOS — Sentio covers the habits, insights, and interventions students actually
          need.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map(({ icon: Icon, title, description }) => (
          <div key={title} className="card transition-colors hover:border-hairline-strong hover:bg-surface-2">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="font-medium">{title}</h3>
            <p className="mt-2 text-sm text-ink-subtle">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function MoodScale() {
  return (
    <section className="border-y border-hairline bg-surface-1/30 py-16">
      <div className="landing-container">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Mood, energy & anxiety</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              Five-point scales that map to how you actually feel
            </h2>
            <p className="mt-4 text-ink-muted">
              Each check-in captures mood, energy, and anxiety independently — because a good mood day can still carry
              high anxiety before a mock.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:justify-end">
            {[1, 2, 3, 4, 5].map((score) => (
              <div
                key={score}
                className="card flex w-24 flex-col items-center gap-2 py-4 text-center"
                style={{
                  borderColor: `color-mix(in srgb, ${MOOD_COLORS[score]} 35%, #23252a)`,
                }}
              >
                <span className="text-2xl">{MOOD_EMOJIS[score]}</span>
                <span className="text-xs text-ink-subtle">{score}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TriggerChips() {
  const triggers = Object.values(TRIGGER_LABELS)

  return (
    <section className="landing-container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Stress triggers</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          Tag what weighed on you — we track the patterns
        </h2>
        <p className="mt-4 text-ink-muted">
          Eleven common stressors for Indian exam students, surfaced in insights and AI recommendations.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {triggers.map((label) => (
          <span key={label} className="chip">
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

function FeatureSections() {
  return (
    <section className="space-y-20 pb-16 md:space-y-28 md:pb-24">
      {FEATURE_SECTIONS.map((section, index) => {
        const Icon = section.icon
        const reversed = index % 2 === 1

        return (
          <div key={section.id} id={section.id} className="landing-container">
            <div
              className={cn(
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
                reversed && 'lg:[&>*:first-child]:order-2'
              )}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{section.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{section.title}</h2>
                <p className="mt-4 text-ink-muted">{section.description}</p>
                <ul className="mt-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm text-ink-muted">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={cn(
                  'card bg-gradient-to-br to-surface-1',
                  section.accent,
                  'min-h-[280px] p-6 md:p-8'
                )}
              >
                <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-ink">{section.eyebrow}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-subtle">
                  {section.bullets[0]}
                </p>
                {section.bullets[1] && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-subtle">{section.bullets[1]}</p>
                )}
                {section.id === 'insights' && (
                  <div className="mt-6 flex items-end gap-1">
                    {[3, 4, 2, 5, 3, 4, 5].map((h, i) => (
                      <div
                        key={i}
                        className="w-6 rounded-t bg-primary/60"
                        style={{ height: `${h * 12}px` }}
                      />
                    ))}
                  </div>
                )}
                {section.id === 'toolkit' && (
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {TOOLKIT_TOOLS.slice(0, 4).map((tool) => (
                      <div
                        key={tool.id}
                        className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-xs text-ink-muted"
                      >
                        {tool.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

function ExamPhases() {
  const phases = Object.entries(PHASE_LABELS)

  return (
    <section className="border-y border-hairline bg-surface-1/40 py-16 md:py-20">
      <div className="landing-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Exam support</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            Language that meets you where you are in prep
          </h2>
          <p className="mt-4 text-ink-muted">
            Sentio adapts journal prompts and dashboard copy to your phase — from early preparation to the hardest
            wait after results.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {phases.map(([key, label]) => (
            <div key={key} className="card py-4">
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-xs capitalize text-ink-subtle">{key.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {EXAM_TYPES.map((exam) => (
            <span key={exam} className="chip chip-selected">
              {exam}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Four steps to a steadier prep routine</h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.step} className="card relative overflow-hidden">
            <span className="text-4xl font-semibold text-surface-3">{item.step}</span>
            <h3 className="mt-4 font-medium">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-subtle">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PrivacySection() {
  return (
    <section id="privacy" className="landing-container pb-16">
      <div className="card border-hairline-strong bg-gradient-to-br from-surface-1 to-surface-2 p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Privacy & control</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">Your data stays yours</h2>
            <p className="mt-4 text-ink-muted">
              Check-ins live in your private Supabase account. AI is off by default — enable it only if you want journal
              reflections and weekly insights. Export or delete everything from Settings.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              'Encrypted storage via Supabase',
              'AI processes journal text only when enabled',
              'No clinical diagnosis — wellness guidance only',
              'One-click JSON export of profile & check-ins',
              'Permanent account deletion on request',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function FinalCta({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="landing-container pb-20">
      <div className="card bg-gradient-to-br from-primary/20 via-surface-1 to-surface-2 py-12 text-center md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Start with one honest check-in today
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-muted">
          Two minutes a day. Patterns in a week. A steadier mind through exam season.
        </p>
        <Link href={ctaHref} className="btn-primary mt-8 px-6 py-2.5">
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-hairline py-8">
      <div className="landing-container flex flex-col items-center justify-between gap-4 text-sm text-ink-subtle md:flex-row">
        <p>© {new Date().getFullYear()} Sentio — Mental wellness tracker for exam-prep students in India.</p>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
          <a href="#privacy" className="hover:text-ink">
            Privacy
          </a>
        </div>
      </div>
      <p className="landing-container mt-4 text-center text-xs text-ink-tertiary md:text-left">
        Sentio is not a substitute for professional mental health care. If you are in crisis, use the helplines in the
        coping toolkit.
      </p>
    </footer>
  )
}
