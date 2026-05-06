import type { ConversationContext, ConversationTurn } from '../types/domain'

function serializeRecentTurns(turns: ConversationTurn[]): string {
  const recentTurns = turns.slice(-8)
  return recentTurns
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join('\n')
}

export function buildStartPrompt(
  context: ConversationContext,
  coachStyle: string,
): string {
  return [
    'You are an English conversation partner helping the user practice writing.',
    `Conversation theme: ${context.topic}`,
    `Culture and style target: ${context.culture}`,
    `Coaching style: ${coachStyle}`,
    'Start the conversation with a single short message that invites a reply.',
    'Do not provide feedback yet. Just send the opening message.',
  ].join('\n')
}

export function buildEvaluationPrompt(args: {
  context: ConversationContext
  coachStyle: string
  history: ConversationTurn[]
  userMessage: string
}): string {
  const { context, coachStyle, history, userMessage } = args

  return [
    'You are both conversation partner and writing evaluator for English practice.',
    `Conversation theme: ${context.topic}`,
    `Culture and style target: ${context.culture}`,
    `Coaching style: ${coachStyle}`,
    'Return ONLY valid JSON in this exact shape:',
    '{',
    '  "assistantReply": "string",',
    '  "analysis": {',
    '    "grammarErrors": ["string"],',
    '    "syntaxErrors": ["string"],',
    '    "naturalnessNotes": ["string"],',
    '    "improvementTips": ["string"],',
    '    "score": 3-10,',
    '    "scoreRationale": "string"',
    '  }',
    '}',
    'Scoring rubric: 3 = major issues, 6 = understandable with clear problems, 8 = strong with minor fixes, 10 = native-like and context-aware.',
    'For each item in grammarErrors and syntaxErrors, include both the problem and the corrected version.',
    'Use this format for grammarErrors and syntaxErrors items: "Issue: <what is wrong>. Correct: <correct sentence or phrase>."',
    'At least one actionable suggestion in improvementTips.',
    'You may use markdown for clarity (for example: "**Pronoun Clarity:** ...").',
    'If the user gives very short answer to social question, recommend extending and reciprocating naturally.',
    'Conversation history:',
    serializeRecentTurns(history),
    `Latest user message: ${userMessage}`,
  ].join('\n')
}
