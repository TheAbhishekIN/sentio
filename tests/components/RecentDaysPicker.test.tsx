import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { RecentDaysPicker, BACKFILL_DAYS } from '@/components/checkin/RecentDaysPicker'
import { makeCheckin } from '../fixtures'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('RecentDaysPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders four day slots', () => {
    render(<RecentDaysPicker checkins={[]} />)
    expect(screen.getByText(`Last ${BACKFILL_DAYS} days`)).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(BACKFILL_DAYS)
  })

  it('shows mood emoji for filled days and add link for empty', () => {
    const checkins = [makeCheckin({ checkinDate: '2026-06-06', moodScore: 4 })]
    render(<RecentDaysPicker checkins={checkins} selectedDate="2026-06-06" />)
    expect(screen.getAllByText('+ Add')).toHaveLength(BACKFILL_DAYS - 1)
    expect(screen.getByTitle('Check-in saved')).toBeInTheDocument()
  })

  it('shows unlock hint when fewer than 3 days filled', () => {
    render(<RecentDaysPicker checkins={[]} />)
    expect(screen.getByText(/Add 3 more days/)).toBeInTheDocument()
  })

  it('shows journal tip when today missing', () => {
    render(<RecentDaysPicker checkins={[makeCheckin({ checkinDate: '2026-06-05' })]} />)
    expect(screen.getByText(/30 characters/)).toBeInTheDocument()
  })

  it('shows singular unlock hint when one day remains', () => {
    const checkins = [
      makeCheckin({ checkinDate: '2026-06-04' }),
      makeCheckin({ id: 'c2', checkinDate: '2026-06-05' }),
    ]
    render(<RecentDaysPicker checkins={checkins} />)
    expect(screen.getByText(/Add 1 more day to unlock/)).toBeInTheDocument()
  })

  it('hides unlock hint when three or more days filled', () => {
    const checkins = [
      makeCheckin({ checkinDate: '2026-06-03' }),
      makeCheckin({ id: 'c2', checkinDate: '2026-06-04' }),
      makeCheckin({ id: 'c3', checkinDate: '2026-06-05' }),
    ]
    render(<RecentDaysPicker checkins={checkins} />)
    expect(screen.queryByText(/Add .* more day/)).not.toBeInTheDocument()
  })

  it('highlights selected date', () => {
    render(
      <RecentDaysPicker
        checkins={[makeCheckin({ checkinDate: '2026-06-06', moodScore: 5 })]}
        selectedDate="2026-06-06"
      />
    )
    const todayLink = screen.getByTitle('Check-in saved').closest('a')
    expect(todayLink?.className).toContain('border-primary')
  })
})
