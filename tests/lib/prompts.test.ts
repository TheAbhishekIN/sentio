import { describe, expect, it } from 'vitest'
import {
  buildInsightChatSystemPrompt,
  buildJournalReflectionPrompt,
  buildWeeklyInsightPrompt,
  getJournalPrompt,
} from '@/lib/prompts'
import { makeCheckin, makeInsight, makeProfile } from '../fixtures'

describe('prompts', () => {
  it('buildJournalReflectionPrompt includes student context and journal', () => {
    const prompt = buildJournalReflectionPrompt({
      name: 'Aarav',
      exam: 'JEE',
      phase: 'intensive',
      moodScore: 2,
      anxietyLevel: 4,
      energyLevel: 2,
      triggers: ['mock_score', 'unknown_trigger'],
      journalEntry: 'Mock went badly today.',
      studyHours: 8,
      sleepHours: 5,
    })
    expect(prompt).toContain('Aarav')
    expect(prompt).toContain('JEE')
    expect(prompt).toContain('Mock Score')
    expect(prompt).toContain('unknown_trigger')
    expect(prompt).toContain('Mock went badly today.')
    expect(prompt).toContain('Do NOT start with "I"')
  })

  it('buildJournalReflectionPrompt handles empty triggers', () => {
    const prompt = buildJournalReflectionPrompt({
      name: 'A',
      exam: 'NEET',
      phase: 'preparation',
      moodScore: 3,
      anxietyLevel: 3,
      energyLevel: 3,
      triggers: [],
      journalEntry: 'Okay day.',
      studyHours: 4,
      sleepHours: 7,
    })
    expect(prompt).toContain('none mentioned')
  })

  it('buildWeeklyInsightPrompt summarizes checkins and asks for JSON array', () => {
    const checkins = [
      makeCheckin({ moodScore: 3, anxietyLevel: 4, sleepHours: 6, studyHours: 8, triggers: ['mock_score'] }),
      makeCheckin({ id: 'c2', moodScore: 4, anxietyLevel: 2, sleepHours: 7, studyHours: 5, triggers: ['sleep_issues'] }),
    ]
    const prompt = buildWeeklyInsightPrompt({ checkins, burnoutScore: 55 })
    expect(prompt).toContain('2 check-ins')
    expect(prompt).toContain('Burnout score: 55/100')
    expect(prompt).toContain('JSON array')
    expect(prompt).toContain('Mock Score')
  })

  it('buildWeeklyInsightPrompt handles no triggers', () => {
    const prompt = buildWeeklyInsightPrompt({
      checkins: [makeCheckin({ triggers: [] })],
      burnoutScore: 10,
    })
    expect(prompt).toContain('none recorded')
  })

  it('buildInsightChatSystemPrompt includes insight data and strict rules', () => {
    const prompt = buildInsightChatSystemPrompt({
      profile: makeProfile(),
      insight: makeInsight({ topTriggers: [] }),
    })
    expect(prompt).toContain('Sentio')
    expect(prompt).toContain('Aarav')
    expect(prompt).toContain('STRICT RULES')
    expect(prompt).toContain('none recorded')
    expect(prompt).toContain('1. Sleep 7h')
  })

  it('buildInsightChatSystemPrompt maps unknown triggers', () => {
    const prompt = buildInsightChatSystemPrompt({
      profile: makeProfile(),
      insight: makeInsight({ topTriggers: ['custom_trigger'] }),
    })
    expect(prompt).toContain('custom_trigger')
  })

  it('getJournalPrompt varies by phase and mood', () => {
    expect(getJournalPrompt(4, 'exam_week')).toContain('exam')
    expect(getJournalPrompt(4, 'result_wait')).toContain('Waiting')
    expect(getJournalPrompt(2, 'preparation')).toContain('hardest')
    expect(getJournalPrompt(3, 'preparation')).toContain('differently')
    expect(getJournalPrompt(5, 'preparation')).toContain('well today')
  })
})
