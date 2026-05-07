import { describe, expect, it, vi } from 'vitest'

vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({})),
}))

import type { PracticeSession } from '../types/domain'
import { extractScorePoints, getSessionAverageScore } from './sessionDb'

const baseSession: PracticeSession = {
  id: 'session-1',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:10:00.000Z',
  topic: 'Casual conversation',
  culture: 'American English (US)',
  provider: 'ollama',
  model: 'llama3.1:8b',
  turns: [],
}

describe('extractScorePoints', () => {
  it('returns only scored user turns', () => {
    const session: PracticeSession = {
      ...baseSession,
      turns: [
        {
          id: 'u1',
          role: 'user',
          content: 'hello',
          createdAt: '2026-01-01T10:00:01.000Z',
          analysis: {
            grammarErrors: [],
            syntaxErrors: [],
            naturalnessNotes: [],
            improvementTips: [],
            score: 7,
            scoreRationale: 'clear',
          },
        },
        {
          id: 'a1',
          role: 'assistant',
          content: 'Hi!',
          createdAt: '2026-01-01T10:00:02.000Z',
        },
        {
          id: 'u2',
          role: 'user',
          content: 'thanks',
          createdAt: '2026-01-01T10:00:03.000Z',
        },
      ],
    }

    expect(extractScorePoints(session)).toEqual([
      {
        turnId: 'u1',
        at: '2026-01-01T10:00:01.000Z',
        score: 7,
      },
    ])
  })
})

describe('getSessionAverageScore', () => {
  it('returns 0 when no scored turns exist', () => {
    expect(getSessionAverageScore(baseSession)).toBe(0)
  })

  it('calculates and rounds average score to two decimals', () => {
    const session: PracticeSession = {
      ...baseSession,
      turns: [
        {
          id: 'u1',
          role: 'user',
          content: 'first',
          createdAt: '2026-01-01T10:00:01.000Z',
          analysis: {
            grammarErrors: [],
            syntaxErrors: [],
            naturalnessNotes: [],
            improvementTips: [],
            score: 7,
            scoreRationale: 'ok',
          },
        },
        {
          id: 'u2',
          role: 'user',
          content: 'second',
          createdAt: '2026-01-01T10:00:02.000Z',
          analysis: {
            grammarErrors: [],
            syntaxErrors: [],
            naturalnessNotes: [],
            improvementTips: [],
            score: 8,
            scoreRationale: 'better',
          },
        },
      ],
    }

    expect(getSessionAverageScore(session)).toBe(7.5)
  })
})
