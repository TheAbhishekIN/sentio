import type { MoodCheckin, UserProfile, WellnessInsight } from '@/lib/types'

export function makeCheckin(overrides: Partial<MoodCheckin> = {}): MoodCheckin {
  return {
    id: 'checkin-1',
    userId: 'user-1',
    checkinDate: '2026-06-01',
    createdAt: '2026-06-01T10:00:00Z',
    moodScore: 3,
    energyLevel: 3,
    anxietyLevel: 3,
    triggers: ['self_doubt'],
    journalEntry: 'Feeling okay about prep today.',
    gratitudeNote: null,
    studyHours: 6,
    sleepHours: 7,
    copingUsed: [],
    aiReflection: null,
    ...overrides,
  }
}

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    name: 'Aarav',
    exam: 'JEE',
    examDate: '2026-08-01',
    phase: 'intensive',
    targetCollege: null,
    motivationalAnchor: null,
    reminderTime: null,
    streakCount: 5,
    lastCheckinDate: '2026-06-05',
    totalCheckins: 10,
    aiEnabled: true,
    onboardingComplete: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

export function makeInsight(overrides: Partial<WellnessInsight> = {}): WellnessInsight {
  return {
    id: 'insight-1',
    userId: 'user-1',
    weekOf: '2026-22',
    generatedAt: '2026-06-01T00:00:00Z',
    avgMood: 3.5,
    avgAnxiety: 3.2,
    topTriggers: ['sleep_issues', 'mock_score'],
    burnoutScore: 45,
    burnoutRisk: 'medium',
    aiInsightText: 'Take breaks.',
    recommendations: ['Sleep 7h', 'One mock review', 'Walk daily'],
    ...overrides,
  }
}

export async function jsonBody<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>
}
