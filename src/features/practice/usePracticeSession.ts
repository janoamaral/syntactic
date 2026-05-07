import { useState, useCallback } from 'react'
import type {
  AppSettings,
  ConversationContext,
  ConversationTurn,
  FeedbackAnalysis,
  PracticeSession,
  SessionReview,
} from '../../types/domain'
import { getProvider } from '../../llm/providers'
import { saveSession } from '../../storage/sessionDb'

export type SessionPhase = 'idle' | 'starting' | 'active' | 'loading' | 'reviewing'

export interface PracticeSessionState {
  phase: SessionPhase
  session: PracticeSession | null
  latestAnalysis: FeedbackAnalysis | null
  sessionReview: SessionReview | null
  error: string | null
}

export interface PracticeSessionActions {
  startSession: (context: ConversationContext) => Promise<void>
  submitUserTurn: (userMessage: string) => Promise<boolean>
  finishSession: () => Promise<void>
  resetSession: () => void
  clearError: () => void
}

function makeId(): string {
  return crypto.randomUUID()
}

export function usePracticeSession(
  settings: AppSettings,
): PracticeSessionState & PracticeSessionActions {
  const [state, setState] = useState<PracticeSessionState>({
    phase: 'idle',
    session: null,
    latestAnalysis: null,
    sessionReview: null,
    error: null,
  })

  const startSession = useCallback(
    async (context: ConversationContext) => {
      setState((prev) => ({ ...prev, phase: 'starting', error: null }))

      try {
        const provider = getProvider(settings.provider)
        const opening = await provider.startConversation(context, settings)

        const now = new Date().toISOString()
        const openingTurn: ConversationTurn = {
          id: makeId(),
          role: 'assistant',
          content: opening,
          createdAt: now,
        }

        const session: PracticeSession = {
          id: makeId(),
          createdAt: now,
          updatedAt: now,
          topic: context.topic,
          culture: context.culture,
          provider: settings.provider,
          model: settings.model,
          turns: [openingTurn],
        }

        await saveSession(session)
        setState({ phase: 'active', session, latestAnalysis: null, sessionReview: null, error: null })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          phase: 'idle',
          error: err instanceof Error ? err.message : 'Failed to start conversation.',
        }))
      }
    },
    [settings],
  )

  const submitUserTurn = useCallback(
    async (userMessage: string) => {
      if (state.phase !== 'active' || !state.session) return false

      setState((prev) => ({ ...prev, phase: 'loading', error: null }))

      const context: ConversationContext = {
        topic: state.session.topic,
        culture: state.session.culture,
      }

      try {
        const provider = getProvider(settings.provider)
        const result = await provider.evaluateUserTurn({
          context,
          settings,
          turns: state.session.turns,
          userMessage,
        })

        const now = new Date().toISOString()

        const userTurn: ConversationTurn = {
          id: makeId(),
          role: 'user',
          content: userMessage,
          createdAt: now,
          analysis: result.analysis,
        }

        const assistantTurn: ConversationTurn = {
          id: makeId(),
          role: 'assistant',
          content: result.assistantReply,
          createdAt: now,
        }

        const updatedSession: PracticeSession = {
          ...state.session,
          updatedAt: now,
          turns: [...state.session.turns, userTurn, assistantTurn],
        }

        await saveSession(updatedSession)

        setState({
          phase: 'active',
          session: updatedSession,
          latestAnalysis: result.analysis,
          sessionReview: null,
          error: null,
        })
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          phase: 'active',
          error: err instanceof Error ? err.message : 'Failed to get a response. Check that Ollama is running.',
        }))
        return false
      }
    },
    [state.phase, state.session, settings],
  )

  const finishSession = useCallback(async () => {
    if (!state.session) return
    const session = state.session

    setState((prev) => ({ ...prev, phase: 'reviewing', error: null }))

    const context: ConversationContext = {
      topic: session.topic,
      culture: session.culture,
    }

    try {
      const provider = getProvider(settings.provider)
      const review = await provider.reviewSession({
        context,
        settings,
        turns: session.turns,
      })

      const reviewedSession: PracticeSession = { ...session, review }
      await saveSession(reviewedSession)

      setState((prev) => ({
        ...prev,
        phase: 'active',
        session: reviewedSession,
        sessionReview: review,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        phase: 'active',
        error: err instanceof Error ? err.message : 'Failed to generate session review.',
      }))
    }
  }, [state.session, settings])

  const resetSession = useCallback(() => {
    setState({ phase: 'idle', session: null, latestAnalysis: null, sessionReview: null, error: null })
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return { ...state, startSession, submitUserTurn, finishSession, resetSession, clearError }
}
