import { describe, expect, it } from 'vitest'

import type { ConversationContext, ConversationTurn } from '../types/domain'
import { buildEvaluationPrompt, buildStartPrompt } from './prompts'

const baseContext: ConversationContext = {
  topic: 'Interview preparation',
  culture: 'American English (US)',
  adaptiveMode: false,
}

describe('buildStartPrompt', () => {
  it('mentions adaptive mode enabled when requested', () => {
    const prompt = buildStartPrompt({ ...baseContext, adaptiveMode: true }, 'Direct but supportive')

    expect(prompt).toContain('Adaptive mode: enabled')
  })

  it('mentions adaptive mode disabled when not enabled', () => {
    const prompt = buildStartPrompt(baseContext, 'Direct but supportive')

    expect(prompt).toContain('Adaptive mode: disabled')
  })
})

describe('buildEvaluationPrompt', () => {
  it('injects adaptive steering instructions and recent weakness context', () => {
    const history: ConversationTurn[] = [
      {
        id: 'a1',
        role: 'assistant',
        content: 'Tell me about what you did yesterday.',
        createdAt: '2026-05-01T10:00:00.000Z',
      },
      {
        id: 'u1',
        role: 'user',
        content: 'I go to the park and play football.',
        createdAt: '2026-05-01T10:01:00.000Z',
        analysis: {
          grammarErrors: [
            'Issue: Wrong tense. Correct: I went to the park and played football.',
          ],
          syntaxErrors: [],
          naturalnessNotes: [],
          improvementTips: [
            'Add more detail about when and with whom you played.',
          ],
          score: 5,
          scoreRationale: 'Understandable but tense and detail issues.',
        },
      },
    ]

    const prompt = buildEvaluationPrompt({
      context: { ...baseContext, adaptiveMode: true },
      coachStyle: 'Direct but supportive',
      history,
      userMessage: 'Today I am tired.',
    })

    expect(prompt).toContain('Adaptive mode: enabled')
    expect(prompt).toContain('Recent weakness targets from previous scored turns:')
    expect(prompt).toContain('Wrong tense')
    expect(prompt).toContain('Add more detail')
  })
})
