import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ExamPhase } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** Last N calendar days including today, oldest first. */
export function recentDaysISO(count: number): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function relativeDayLabel(dateStr: string): string {
  const today = todayISO()
  if (dateStr === today) return 'Today'
  const yesterday = recentDaysISO(2)[0]
  if (dateStr === yesterday) return 'Yesterday'
  return formatShortDate(dateStr)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function computePhase(examDate: string | null, isResultWait = false): ExamPhase {
  if (isResultWait) return 'result_wait'
  if (!examDate) return 'preparation'
  const days = daysUntil(examDate)
  if (days === null) return 'preparation'
  if (days < 0) return 'post_result'
  if (days <= 7) return 'exam_week'
  if (days <= 30) return 'pre_exam'
  if (days <= 90) return 'intensive'
  return 'preparation'
}

export function getWeekOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export function getTimeOfDayTheme(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'from-amber-500/20 to-surface-1'
  if (hour >= 12 && hour < 17) return 'from-sky-500/20 to-surface-1'
  if (hour >= 17 && hour < 21) return 'from-primary/20 to-surface-1'
  return 'from-indigo-900/40 to-surface-1'
}

export function calcStreak(lastDate: string | null, currentStreak: number, newDate: string): number {
  if (!lastDate) return 1
  const last = new Date(lastDate + 'T12:00:00')
  const current = new Date(newDate + 'T12:00:00')
  const diff = Math.round((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return currentStreak
  if (diff === 1) return currentStreak + 1
  return 1
}

export function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function vibrate(ms = 50) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trim() + '…'
}
