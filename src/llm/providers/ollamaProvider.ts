import { buildEvaluationPrompt, buildSessionReviewPrompt, buildStartPrompt } from '../prompts'
import type { LlmEvaluationResult, LlmProvider } from '../provider'
import { llmOutputSchema, sessionReviewSchema, tryExtractJson } from '../../utils/schema'
import type { AppSettings, ConversationContext, ConversationTurn, SessionReview } from '../../types/domain'

interface OllamaGenerateResponse {
  response: string
}

async function callOllama(settings: AppSettings, prompt: string): Promise<string> {
  const response = await fetch(`${settings.ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      prompt,
      stream: false,
      options: {
        temperature: settings.temperature,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status}).`)
  }

  const payload = (await response.json()) as OllamaGenerateResponse
  if (!payload.response) {
    throw new Error('Ollama returned an empty response.')
  }

  return payload.response.trim()
}

export const ollamaProvider: LlmProvider = {
  id: 'ollama',

  async startConversation(
    context: ConversationContext,
    settings: AppSettings,
  ): Promise<string> {
    const prompt = buildStartPrompt(context, settings.coachStyle, settings.userLanguage)
    return callOllama(settings, prompt)
  },

  async evaluateUserTurn(args: {
    context: ConversationContext
    settings: AppSettings
    turns: ConversationTurn[]
    userMessage: string
  }): Promise<LlmEvaluationResult> {
    const prompt = buildEvaluationPrompt({
      context: args.context,
      coachStyle: args.settings.coachStyle,
      history: args.turns,
      userMessage: args.userMessage,
      userLanguage: args.settings.userLanguage,
    })

    const raw = await callOllama(args.settings, prompt)
    const extracted = tryExtractJson(raw)
    const parsed = llmOutputSchema.safeParse(extracted)

    if (!parsed.success) {
      throw new Error('Model output could not be parsed into the expected schema.')
    }

    return parsed.data
  },

  async reviewSession(args: {
    context: ConversationContext
    settings: AppSettings
    turns: ConversationTurn[]
  }): Promise<SessionReview> {
    const prompt = buildSessionReviewPrompt({
      context: args.context,
      coachStyle: args.settings.coachStyle,
      userLanguage: args.settings.userLanguage,
      turns: args.turns,
    })

    const raw = await callOllama(args.settings, prompt)
    const extracted = tryExtractJson(raw)
    const parsed = sessionReviewSchema.safeParse(extracted)

    if (!parsed.success) {
      throw new Error('Session review could not be parsed into the expected schema.')
    }

    return parsed.data
  },
}
