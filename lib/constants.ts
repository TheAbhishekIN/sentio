import type { ExamPhase, ExamType, StressTrigger } from './types'

export const MOOD_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#EAB308',
  4: '#22C55E',
  5: '#8B5CF6',
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing',
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😔',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export const EXAM_TYPES: ExamType[] = [
  'JEE',
  'NEET',
  'CUET',
  'CAT',
  'GATE',
  'UPSC',
  'Board',
  'Other',
]

export const TRIGGER_LABELS: Record<StressTrigger, string> = {
  mock_score: 'Mock Score',
  syllabus_overload: 'Syllabus Overload',
  sleep_issues: 'Sleep Issues',
  comparison: 'Comparison',
  family_pressure: 'Family Pressure',
  time_management: 'Time Management',
  self_doubt: 'Self-Doubt',
  physical_health: 'Physical Health',
  social_isolation: 'Social Isolation',
  financial_stress: 'Financial Stress',
  other: 'Other',
}

export const ALL_TRIGGERS: StressTrigger[] = [
  'mock_score',
  'syllabus_overload',
  'sleep_issues',
  'comparison',
  'family_pressure',
  'time_management',
  'self_doubt',
  'physical_health',
  'social_isolation',
  'financial_stress',
  'other',
]

export const PHASE_LABELS: Record<ExamPhase, string> = {
  preparation: 'Preparation',
  intensive: 'Intensive',
  pre_exam: 'Pre-Exam',
  exam_week: 'Exam Week',
  result_wait: 'Result Wait',
  post_result: 'Post Result',
}

export const PHASE_COPY: Record<ExamPhase, string> = {
  preparation: 'You have time — build healthy habits now.',
  intensive: 'Crunch time. Consistency is your edge.',
  pre_exam: 'Final stretch. Take care of your mind.',
  exam_week: "You've prepared. Trust yourself.",
  result_wait: "The hardest wait. We're here for you.",
  post_result: 'Whatever the result — your journey continues.',
}

export const TOOLKIT_TOOLS = [
  {
    id: 'breathing',
    name: 'Box Breathing',
    description: '4-4-4-4 breathing cycle',
    icon: 'Wind',
  },
  {
    id: 'grounding',
    name: '5-4-3-2-1 Grounding',
    description: 'Sensory grounding for anxiety',
    icon: 'Hand',
  },
  {
    id: 'break-timer',
    name: 'Study Break Timer',
    description: 'Pomodoro-style focus breaks',
    icon: 'Timer',
  },
  {
    id: 'anchor',
    name: 'Motivational Anchor',
    description: 'Write and revisit your why',
    icon: 'Anchor',
  },
  {
    id: 'relax',
    name: 'Progressive Relaxation',
    description: 'Guided body scan',
    icon: 'Sparkles',
  },
  {
    id: 'affirmations',
    name: 'Exam Affirmations',
    description: 'Positive affirmations',
    icon: 'Heart',
  },
  {
    id: 'sos',
    name: 'Panic SOS',
    description: 'Immediate panic relief',
    icon: 'AlertCircle',
  },
  {
    id: 'helplines',
    name: 'Helplines',
    description: 'iCall, Vandrevala, NIMHANS',
    icon: 'Phone',
  },
] as const

export const AFFIRMATIONS = [
  'I have prepared as well as I can. That is enough.',
  'One exam does not define my worth or my future.',
  'I can handle difficult moments and come out stronger.',
  'My effort today matters more than perfect results.',
  'I am allowed to rest without guilt.',
  'Comparison steals focus — I run my own race.',
  'Every small step of preparation counts.',
  'I trust the process I have built.',
]

export const RELAXATION_STEPS = [
  'Unclench your jaw and let your tongue rest softly.',
  'Drop your shoulders away from your ears.',
  'Relax your hands — open your palms.',
  'Soften your stomach — breathe into your belly.',
  'Release tension in your thighs and calves.',
  'Let your feet feel heavy on the ground.',
  'Take three slow breaths. You are safe right now.',
]
