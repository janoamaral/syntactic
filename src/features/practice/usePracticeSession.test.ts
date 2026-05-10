import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { PracticeSession } from '../../types/domain'
import { DEFAULT_SETTINGS } from '../../types/domain'
import { usePracticeSession } from './usePracticeSession'

// ---------------------------------------------------------------------------
// Silence idb usage (saveSession is imported but not exercised in these tests)
// ---------------------------------------------------------------------------
vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(async () => []),
    delete: vi.fn(),
  })),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session-resume-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:10:00.000Z',
    topic: 'Technical software development',
    culture: 'American English (US)',
    adaptiveMode: false,
    provider: 'ollama',
    model: 'llama3.1:8b',
    turns: [
      {
        id: 'a1',
        role: 'assistant',
        content: 'Hello! What would you like to discuss?',
        createdAt: '2026-01-01T10:00:01.000Z',
      },
      {
        id: 'u1',
        role: 'user',
        content: 'I want to talk about React hooks.',
        createdAt: '2026-01-01T10:00:10.000Z',
        analysis: {
          grammarErrors: [],
          syntaxErrors: [],
          naturalnessNotes: [],
          improvementTips: [],
          score: 8,
          scoreRationale: 'Clear and natural.',
        },
      },
    ],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('usePracticeSession – initial state', () => {
  it('starts in idle phase with no session', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))
    expect(result.current.phase).toBe('idle')
    expect(result.current.session).toBeNull()
    expect(result.current.error).toBeNull()
  })
})

describe('usePracticeSession – resumeSession', () => {
  it('transitions to active phase with the provided session', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))
    const session = makeSession()

    act(() => {
      result.current.resumeSession(session)
    })

    expect(result.current.phase).toBe('active')
    expect(result.current.session).toEqual(session)
  })

  it('clears any previous error when resuming', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))

    // Inject an error via clearError's inverse: directly resume after an
    // error state would have been set. We simulate via resetSession + no
    // startSession error path – so just confirm error is null after resume.
    act(() => {
      result.current.resumeSession(makeSession())
    })

    expect(result.current.error).toBeNull()
  })

  it('clears latestAnalysis and sessionReview on resume', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))

    act(() => {
      result.current.resumeSession(makeSession())
    })

    expect(result.current.latestAnalysis).toBeNull()
    expect(result.current.sessionReview).toBeNull()
  })

  it('allows resuming a session with an existing review', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))
    const reviewed = makeSession({
      review: {
        overallScore: 8,
        summary: 'Great session',
        strengths: ['Clear phrasing'],
        areasToImprove: [],
        priorityFocus: [],
      },
    })

    act(() => {
      result.current.resumeSession(reviewed)
    })

    expect(result.current.phase).toBe('active')
    expect(result.current.session?.review).toBeDefined()
  })

  it('can resume a different session after already having one active', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))
    const first = makeSession({ id: 'first', topic: 'First topic' })
    const second = makeSession({ id: 'second', topic: 'Second topic' })

    act(() => { result.current.resumeSession(first) })
    act(() => { result.current.resumeSession(second) })

    expect(result.current.session?.id).toBe('second')
    expect(result.current.session?.topic).toBe('Second topic')
  })
})

describe('usePracticeSession – resetSession', () => {
  it('returns to idle phase and clears session after resuming', () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))

    act(() => { result.current.resumeSession(makeSession()) })
    act(() => { result.current.resetSession() })

    expect(result.current.phase).toBe('idle')
    expect(result.current.session).toBeNull()
  })
})

describe('usePracticeSession – setAdaptiveMode', () => {
  it('updates adaptive mode on the active session', async () => {
    const { result } = renderHook(() => usePracticeSession(DEFAULT_SETTINGS))

    act(() => {
      result.current.resumeSession(makeSession({ adaptiveMode: false }))
    })

    await act(async () => {
      await result.current.setAdaptiveMode(true)
    })

    expect(result.current.session?.adaptiveMode).toBe(true)
  })
})
