'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useAllCheckins } from '@/hooks/useCheckin'
import { EXAM_TYPES } from '@/lib/constants'
import { computePhase, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { ExamType } from '@/lib/types'

export default function SettingsPage() {
  const { user, supabase } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: checkins = [] } = useAllCheckins(user?.id)
  const updateProfile = useUpdateProfile()
  const { showToast } = useToast()
  const router = useRouter()

  const [name, setName] = useState('')
  const [exam, setExam] = useState<ExamType>('JEE')
  const [examDate, setExamDate] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [enablingNotifications, setEnablingNotifications] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setExam(profile.exam)
      setExamDate(profile.examDate ?? '')
      setAiEnabled(profile.aiEnabled)
      setReminderTime(profile.reminderTime ?? '09:00')
    }
  }, [profile])

  async function saveProfile() {
    if (!user) return
    setSavingProfile(true)
    try {
      const phase = computePhase(examDate || null)
      await updateProfile.mutateAsync({
        id: user.id,
        name,
        exam,
        examDate: examDate || null,
        phase,
        aiEnabled,
        reminderTime,
      })
      showToast('Profile updated', 'success')
    } catch {
      showToast('Could not save profile', 'error')
    }
    setSavingProfile(false)
  }

  async function requestNotifications() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported', 'error')
      return
    }
    setEnablingNotifications(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        showToast('Reminders enabled', 'success')
        if (user) {
          await updateProfile.mutateAsync({ id: user.id, reminderTime })
        }
      }
    } finally {
      setEnablingNotifications(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const data = { profile, checkins, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentio-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Data exported', 'success')
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function signOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      window.location.assign('/login/')
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <AppShell>
      <LoadingOverlay show={signingOut} label="Signing out…" />
      <div className="page-container space-y-6">
        <TopBar title="Settings" />

        <section className="card space-y-4">
          <h2 className="font-medium text-ink">Profile</h2>
          <label className="block text-sm text-ink-muted">
            Name
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div>
            <p className="mb-2 text-sm text-ink-muted">Exam</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExam(e)}
                  disabled={savingProfile}
                  className={cn('chip', exam === e && 'chip-selected')}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm text-ink-muted">
            Exam date
            <input
              type="date"
              className="input mt-1"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              disabled={savingProfile}
            />
          </label>
          {profile && (
            <p className="text-xs text-ink-subtle">
              {profile.totalCheckins} check-ins · Joined{' '}
              {formatDate(profile.createdAt.split('T')[0])}
            </p>
          )}
          <LoadingButton
            loading={savingProfile}
            loadingText="Saving…"
            onClick={saveProfile}
            className="w-full"
          >
            Save profile
          </LoadingButton>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium text-ink">AI settings</h2>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              disabled={savingProfile}
              className="mt-1"
            />
            <div>
              <p className="text-sm text-ink">Enable AI reflections</p>
              <p className="text-xs text-ink-subtle">
                Uses Google Gemini. Journal entries sent for that request only.
              </p>
            </div>
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium text-ink">Notifications</h2>
          <label className="block text-sm text-ink-muted">
            Daily reminder
            <input
              type="time"
              className="input mt-1"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={enablingNotifications}
            />
          </label>
          <LoadingButton
            variant="secondary"
            loading={enablingNotifications}
            loadingText="Enabling…"
            onClick={requestNotifications}
            className="w-full"
          >
            Enable browser notifications
          </LoadingButton>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium text-ink">Data & privacy</h2>
          <p className="text-xs text-ink-subtle">
            Your data is stored in Supabase (encrypted at rest). AI reflections are processed via
            Google Gemini.
          </p>
          <LoadingButton
            variant="secondary"
            loading={exporting}
            loadingText="Exporting…"
            onClick={exportData}
            className="w-full"
          >
            Export my data
          </LoadingButton>
          <LoadingButton
            variant="secondary"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="w-full text-danger"
          >
            Delete my account
          </LoadingButton>
          <LoadingButton
            variant="tertiary"
            loading={signingOut}
            loadingText="Signing out…"
            onClick={signOut}
            className="w-full"
          >
            Sign out
          </LoadingButton>
        </section>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="card max-w-sm">
              <p className="font-medium text-ink">Delete account?</p>
              <p className="mt-2 text-sm text-ink-subtle">
                This permanently deletes all your data. This cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <LoadingButton
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  loading={deleting}
                  loadingText="Deleting…"
                  onClick={deleteAccount}
                  className="flex-1 bg-danger hover:bg-danger/90"
                >
                  Delete
                </LoadingButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
