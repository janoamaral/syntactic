import { z } from 'zod'

import type { AppSettings } from '../types/domain'

export const feedbackAnalysisSchema = z.object({
  grammarErrors: z.array(z.string()),
  syntaxErrors: z.array(z.string()),
  naturalnessNotes: z.array(z.string()),
  improvementTips: z.array(z.string()),
  score: z.number().min(3).max(10),
  scoreRationale: z.string().min(1),
})

export const llmOutputSchema = z.object({
  assistantReply: z.string().min(1),
  analysis: feedbackAnalysisSchema,
})

export const sessionReviewSchema = z.object({
  overallScore: z.number().min(3).max(10),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  priorityFocus: z.array(z.string()),
})

const settingsSchema = z.object({
  version: z.number().int().positive(),
  provider: z.enum(['ollama', 'openai', 'google', 'anthropic', 'qwen']),
  model: z.string().min(1),
  ollamaBaseUrl: z.url(),
  apiKey: z.string().default(''),
  temperature: z.number().min(0).max(1),
  defaultTopic: z.string().min(1),
  defaultCulture: z.string().min(1),
  userLanguage: z.string().min(1),
  coachStyle: z.string().min(1),
  speechEnabled: z.boolean(),
})

export function parseSettings(data: unknown): AppSettings {
  const parsed = settingsSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid settings payload.')
  }

  return parsed.data
}

export function tryExtractJson(rawText: string): unknown {
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Model did not return valid JSON.')
  }

  const candidate = rawText.slice(firstBrace, lastBrace + 1)
  return JSON.parse(candidate)
}
