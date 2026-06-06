import type { MoodCheckin, BurnoutRisk } from './types'
import { avg } from './utils'

export function calculateBurnoutScore(checkins: MoodCheckin[]): {
  score: number
  risk: BurnoutRisk
  factors: string[]
} {
  const last7 = checkins.slice(0, 7)
  let score = 0
  const factors: string[] = []

  if (!last7.length) {
    return { score: 0, risk: 'low', factors: [] }
  }

  const avgAnxiety = avg(last7.map((c) => c.anxietyLevel))
  score += (avgAnxiety / 5) * 20

  const lowMoodDays = last7.filter((c) => c.moodScore <= 2).length
  score += (lowMoodDays / 7) * 25
  if (lowMoodDays >= 3) factors.push('Frequent low mood days')

  const avgStudy = avg(last7.map((c) => c.studyHours))
  if (avgStudy > 10) {
    score += 15
    factors.push('Very high study hours')
  }

  const last3Sleep = checkins.slice(0, 3).map((c) => c.sleepHours)
  if (last3Sleep.length > 0 && avg(last3Sleep) < 6) {
    score += 20
    factors.push('Insufficient sleep (last 3 days)')
  }

  let badStreak = 0
  for (const c of last7) {
    if (c.moodScore <= 2) badStreak++
    else break
  }
  if (badStreak >= 3) {
    score += 20
    factors.push('3+ consecutive bad mood days')
  }

  score = Math.min(100, Math.round(score))
  const risk: BurnoutRisk =
    score <= 40 ? 'low' : score <= 65 ? 'medium' : score <= 85 ? 'high' : 'critical'

  return { score, risk, factors }
}
