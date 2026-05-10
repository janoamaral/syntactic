export type AppView = 'practice' | 'sessions' | 'progress' | 'settings'

export type ProviderType =
  | 'ollama'
  | 'openai'
  | 'google'
  | 'anthropic'
  | 'qwen'

export type TurnRole = 'assistant' | 'user'

export interface FeedbackAnalysis {
  grammarErrors: string[]
  syntaxErrors: string[]
  naturalnessNotes: string[]
  improvementTips: string[]
  score: number
  scoreRationale: string
}

export interface ConversationTurn {
  id: string
  role: TurnRole
  content: string
  createdAt: string
  analysis?: FeedbackAnalysis
}

export interface ConversationContext {
  topic: string
  culture: string
  adaptiveMode: boolean
}

export interface SessionReview {
  overallScore: number
  summary: string
  strengths: string[]
  areasToImprove: string[]
  priorityFocus: string[]
}

export interface PracticeSession {
  id: string
  createdAt: string
  updatedAt: string
  topic: string
  culture: string
  adaptiveMode?: boolean
  provider: ProviderType
  model: string
  turns: ConversationTurn[]
  review?: SessionReview
}

export interface AppSettings {
  version: number
  provider: ProviderType
  model: string
  ollamaBaseUrl: string
  apiKey: string
  temperature: number
  defaultTopic: string
  defaultCulture: string
  coachStyle: string
  speechEnabled: boolean
}

export interface SessionScorePoint {
  turnId: string
  at: string
  score: number
}

export const TOPIC_OPTIONS = [
  'Casual conversation',
  'Technical software development',
  'Formal professional discussion',
  'Interview preparation',
]

export const CULTURE_OPTIONS = [
  'American English (US)',
  'British English (UK)',
  'International workplace English',
]

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  provider: 'ollama',
  model: 'llama3.1:8b',
  ollamaBaseUrl: 'http://localhost:11434',
  apiKey: '',
  temperature: 0.5,
  defaultTopic: TOPIC_OPTIONS[0],
  defaultCulture: CULTURE_OPTIONS[0],
  coachStyle: 'Supportive but direct. Explain briefly and provide practical rewrites.',
  speechEnabled: false,
}
