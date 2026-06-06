import { describe, expect, it } from 'vitest'
import { calculateBurnoutScore } from '@/lib/burnout'
import { makeCheckin } from '../fixtures'

describe('calculateBurnoutScore', () => {
  it('returns zero score for empty checkins', () => {
    expect(calculateBurnoutScore([])).toEqual({ score: 0, risk: 'low', factors: [] })
  })

  it('returns low risk for healthy checkins', () => {
    const checkins = Array.from({ length: 7 }, (_, i) =>
      makeCheckin({
        id: `c-${i}`,
        moodScore: 4,
        anxietyLevel: 2,
        studyHours: 6,
        sleepHours: 8,
      })
    )
    const result = calculateBurnoutScore(checkins)
    expect(result.risk).toBe('low')
    expect(result.score).toBeLessThanOrEqual(40)
    expect(result.factors).toEqual([])
  })

  it('flags high study hours', () => {
    const checkins = Array.from({ length: 7 }, () =>
      makeCheckin({ studyHours: 12, moodScore: 4, anxietyLevel: 2, sleepHours: 8 })
    )
    const result = calculateBurnoutScore(checkins)
    expect(result.factors).toContain('Very high study hours')
  })

  it('flags insufficient sleep in last 3 days', () => {
    const checkins = [
      makeCheckin({ sleepHours: 4, moodScore: 4, anxietyLevel: 2, studyHours: 6 }),
      makeCheckin({ id: 'c-2', sleepHours: 5, moodScore: 4, anxietyLevel: 2, studyHours: 6 }),
      makeCheckin({ id: 'c-3', sleepHours: 5, moodScore: 4, anxietyLevel: 2, studyHours: 6 }),
    ]
    const result = calculateBurnoutScore(checkins)
    expect(result.factors).toContain('Insufficient sleep (last 3 days)')
  })

  it('flags frequent low mood days', () => {
    const checkins = [
      makeCheckin({ moodScore: 1 }),
      makeCheckin({ id: 'c-2', moodScore: 2 }),
      makeCheckin({ id: 'c-3', moodScore: 1 }),
      makeCheckin({ id: 'c-4', moodScore: 4 }),
    ]
    const result = calculateBurnoutScore(checkins)
    expect(result.factors).toContain('Frequent low mood days')
  })

  it('flags consecutive bad mood streak', () => {
    const checkins = [
      makeCheckin({ moodScore: 1 }),
      makeCheckin({ id: 'c-2', moodScore: 2 }),
      makeCheckin({ id: 'c-3', moodScore: 1 }),
    ]
    const result = calculateBurnoutScore(checkins)
    expect(result.factors).toContain('3+ consecutive bad mood days')
  })

  it('caps score at 100 and assigns critical risk', () => {
    const checkins = Array.from({ length: 7 }, () =>
      makeCheckin({
        moodScore: 1,
        anxietyLevel: 5,
        studyHours: 14,
        sleepHours: 3,
      })
    )
    const result = calculateBurnoutScore(checkins)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(['high', 'critical']).toContain(result.risk)
  })

  it('only uses first 7 checkins', () => {
    const bad = makeCheckin({ moodScore: 1, anxietyLevel: 5, studyHours: 14, sleepHours: 3 })
    const good = makeCheckin({ moodScore: 5, anxietyLevel: 1, studyHours: 4, sleepHours: 9 })
    const high = calculateBurnoutScore([bad, bad, bad]).score
    const low = calculateBurnoutScore([good, good, good, bad, bad, bad]).score
    expect(high).toBeGreaterThan(low)
  })
})
