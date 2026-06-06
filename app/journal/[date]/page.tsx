'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import html2canvas from 'html2canvas'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/utils/supabase/client'
import { getCheckinByDate } from '@/lib/db/checkins'
import { MOOD_EMOJIS, MOOD_LABELS, TRIGGER_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useToast } from '@/components/ui/Toast'

export default function JournalEntryPage({ params }: { params: { date: string } }) {
  const { user } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const [sharing, setSharing] = useState(false)

  const { data: entry, isLoading } = useQuery({
    queryKey: ['journal-entry', user?.id, params.date],
    queryFn: async () => {
      const supabase = createClient()
      return getCheckinByDate(supabase, user!.id, params.date)
    },
    enabled: !!user,
  })

  async function shareAsImage() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0f1011' })
      const link = document.createElement('a')
      link.download = `sentio-${params.date}.png`
      link.href = canvas.toDataURL()
      link.click()
      showToast('Image saved!', 'success')
    } catch {
      showToast('Could not create image', 'error')
    } finally {
      setSharing(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container">
          <div className="h-64 animate-pulse rounded-lg bg-surface-1" />
        </div>
      </AppShell>
    )
  }

  if (!entry) {
    return (
      <AppShell>
        <div className="page-container">
          <TopBar title="Journal" backHref="/journal" />
          <p className="text-ink-subtle">No entry for this date.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="page-container">
        <TopBar
          title="Journal"
          backHref="/journal"
          rightAction={
            <LoadingButton
              variant="secondary"
              loading={sharing}
              loadingText="Saving…"
              onClick={shareAsImage}
              className="text-xs"
            >
              Share
            </LoadingButton>
          }
        />

        <div ref={cardRef} className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-ink">{formatDate(entry.checkinDate)}</h2>
          </div>

          <div className="card flex flex-col items-center py-6">
            <div className="text-5xl">{MOOD_EMOJIS[entry.moodScore]}</div>
            <p className="mt-2 text-ink-muted">{MOOD_LABELS[entry.moodScore]}</p>
          </div>

          <ProgressBar label="Energy" value={entry.energyLevel} />
          <ProgressBar label="Anxiety" value={entry.anxietyLevel} />

          {entry.triggers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.triggers.map((t) => (
                <span key={t} className="chip chip-selected">
                  {TRIGGER_LABELS[t]}
                </span>
              ))}
            </div>
          )}

          <blockquote className="rounded-lg border border-hairline bg-surface-1 p-5 text-ink-muted italic">
            {entry.journalEntry || 'No journal entry.'}
          </blockquote>

          {entry.gratitudeNote && (
            <div className="rounded-lg border border-hairline bg-surface-1 p-4">
              <p className="text-xs uppercase tracking-wider text-ink-subtle">Gratitude</p>
              <p className="mt-1 text-sm text-ink-muted">{entry.gratitudeNote}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-hairline bg-surface-1 p-4 text-center">
              <p className="text-xs text-ink-subtle">Sleep</p>
              <p className="text-xl font-medium">{entry.sleepHours}h</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface-1 p-4 text-center">
              <p className="text-xs text-ink-subtle">Study</p>
              <p className="text-xl font-medium">{entry.studyHours}h</p>
            </div>
          </div>

          {entry.aiReflection && (
            <div className="rounded-lg border border-hairline border-l-4 border-l-primary bg-surface-1 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Wellness Companion
              </p>
              <p className="mt-2 text-sm text-ink-muted">{entry.aiReflection}</p>
            </div>
          )}
        </div>

        <Link href={`/checkin?edit=${entry.checkinDate}`} className="btn-secondary mt-6 block text-center">
          Edit entry
        </Link>
      </div>
    </AppShell>
  )
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink-subtle">{value}/5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  )
}
