export type ExamType = 'JEE' | 'NEET' | 'CUET' | 'CAT' | 'GATE' | 'UPSC' | 'Board' | 'Other'

export type ExamPhase =
  | 'preparation'
  | 'intensive'
  | 'pre_exam'
  | 'exam_week'
  | 'result_wait'
  | 'post_result'

export type StressTrigger =
  | 'mock_score'
  | 'syllabus_overload'
  | 'sleep_issues'
  | 'comparison'
  | 'family_pressure'
  | 'time_management'
  | 'self_doubt'
  | 'physical_health'
  | 'social_isolation'
  | 'financial_stress'
  | 'other'

export type BurnoutRisk = 'low' | 'medium' | 'high' | 'critical'

export interface UserProfile {
  id: string
  name: string
  exam: ExamType
  examDate: string | null
  phase: ExamPhase
  targetCollege?: string | null
  motivationalAnchor?: string | null
  reminderTime?: string | null
  streakCount: number
  lastCheckinDate: string | null
  totalCheckins: number
  aiEnabled: boolean
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface MoodCheckin {
  id: string
  userId: string
  checkinDate: string
  createdAt: string
  moodScore: 1 | 2 | 3 | 4 | 5
  energyLevel: 1 | 2 | 3 | 4 | 5
  anxietyLevel: 1 | 2 | 3 | 4 | 5
  triggers: StressTrigger[]
  journalEntry: string
  gratitudeNote?: string | null
  studyHours: number
  sleepHours: number
  copingUsed: string[]
  aiReflection?: string | null
}

export interface WellnessInsight {
  id: string
  userId: string
  weekOf: string
  generatedAt: string
  avgMood: number
  avgAnxiety: number
  topTriggers: StressTrigger[]
  burnoutScore: number
  burnoutRisk: BurnoutRisk
  aiInsightText?: string | null
  recommendations: string[]
}

export interface CopingSession {
  id: string
  userId: string
  createdAt: string
  toolId: string
  durationSecs: number
  moodBefore?: number | null
  moodAfter?: number | null
}

export interface CheckinFormData {
  moodScore: 1 | 2 | 3 | 4 | 5
  energyLevel: 1 | 2 | 3 | 4 | 5
  anxietyLevel: 1 | 2 | 3 | 4 | 5
  triggers: StressTrigger[]
  journalEntry: string
  gratitudeNote?: string
  studyHours: number
  sleepHours: number
}
