import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  avg,
  calcStreak,
  cn,
  computePhase,
  daysUntil,
  formatDate,
  formatShortDate,
  getGreeting,
  getTimeOfDayTheme,
  getWeekOf,
  recentDaysISO,
  relativeDayLabel,
  todayISO,
  truncate,
  vibrate,
} from '@/lib/utils'

describe('utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cn merges tailwind classes', () => {
    expect(cn('px-2', false && 'hidden', 'px-4')).toBe('px-4')
  })

  it('todayISO returns UTC date string', () => {
    expect(todayISO()).toBe('2026-06-06')
  })

  it('recentDaysISO returns oldest-first dates', () => {
    expect(recentDaysISO(4)).toEqual([
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06',
    ])
  })

  it('relativeDayLabel handles today, yesterday, and other', () => {
    expect(relativeDayLabel('2026-06-06')).toBe('Today')
    expect(relativeDayLabel('2026-06-05')).toBe('Yesterday')
    expect(relativeDayLabel('2026-06-01')).toMatch(/1/)
  })

  it('formatDate and formatShortDate format en-IN', () => {
    expect(formatDate('2026-06-06')).toContain('2026')
    expect(formatShortDate('2026-06-06')).toMatch(/6/)
  })

  it('daysUntil returns null for missing date', () => {
    expect(daysUntil(null)).toBeNull()
  })

  it('daysUntil counts days until exam', () => {
    expect(daysUntil('2026-06-16')).toBe(10)
    expect(daysUntil('2026-06-01')).toBe(-5)
  })

  it('computePhase covers all phases', () => {
    expect(computePhase(null, true)).toBe('result_wait')
    expect(computePhase(null)).toBe('preparation')
    expect(computePhase('2026-05-01')).toBe('post_result')
    expect(computePhase('2026-06-10')).toBe('exam_week')
    expect(computePhase('2026-06-20')).toBe('pre_exam')
    expect(computePhase('2026-07-15')).toBe('intensive')
    expect(computePhase('2026-12-01')).toBe('preparation')
  })

  it('getWeekOf returns ISO week string', () => {
    expect(getWeekOf(new Date('2026-06-06'))).toBe('2026-23')
    expect(getWeekOf(new Date('2026-06-07'))).toBe('2026-23')
  })

  it('getGreeting varies by hour', () => {
    vi.setSystemTime(new Date('2026-06-06T08:00:00'))
    expect(getGreeting()).toBe('Good morning')
    vi.setSystemTime(new Date('2026-06-06T14:00:00'))
    expect(getGreeting()).toBe('Good afternoon')
    vi.setSystemTime(new Date('2026-06-06T19:00:00'))
    expect(getGreeting()).toBe('Good evening')
    vi.setSystemTime(new Date('2026-06-06T22:00:00'))
    expect(getGreeting()).toBe('Good night')
  })

  it('getTimeOfDayTheme varies by hour', () => {
    vi.setSystemTime(new Date('2026-06-06T08:00:00'))
    expect(getTimeOfDayTheme()).toContain('amber')
    vi.setSystemTime(new Date('2026-06-06T14:00:00'))
    expect(getTimeOfDayTheme()).toContain('sky')
    vi.setSystemTime(new Date('2026-06-06T19:00:00'))
    expect(getTimeOfDayTheme()).toContain('primary')
    vi.setSystemTime(new Date('2026-06-06T22:00:00'))
    expect(getTimeOfDayTheme()).toContain('indigo')
  })

  it('calcStreak handles first, same-day, consecutive, and broken streaks', () => {
    expect(calcStreak(null, 0, '2026-06-06')).toBe(1)
    expect(calcStreak('2026-06-06', 3, '2026-06-06')).toBe(3)
    expect(calcStreak('2026-06-05', 3, '2026-06-06')).toBe(4)
    expect(calcStreak('2026-06-03', 5, '2026-06-06')).toBe(1)
  })

  it('avg returns 0 for empty and mean otherwise', () => {
    expect(avg([])).toBe(0)
    expect(avg([2, 4])).toBe(3)
  })

  it('truncate shortens long strings', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('hello world today', 5)).toBe('hello…')
  })

  it('vibrate calls navigator when available', () => {
    const mockVibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate: mockVibrate })
    vibrate(100)
    expect(mockVibrate).toHaveBeenCalledWith(100)
    vi.unstubAllGlobals()
  })

  it('vibrate is safe without navigator', () => {
    vi.stubGlobal('navigator', undefined)
    expect(() => vibrate()).not.toThrow()
    vi.unstubAllGlobals()
  })
})
