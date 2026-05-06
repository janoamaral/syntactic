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

  const lastAssistantMessage = [...history].reverse().find((t) => t.role === 'assistant')?.content ?? null

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
    'Scoring rubric: 3 = major issues or completely off-topic response, 6 = understandable with clear problems, 8 = strong with minor fixes, 10 = native-like and context-aware.',
    'IMPORTANT: Before evaluating grammar and style, first check if the user\'s message is a relevant and coherent response to the last assistant message.',
    'If the user\'s response does not address or relate to what was asked or said, penalise the score heavily (score 3-4) and add a note in improvementTips explaining that the response is off-topic and describing what kind of reply would have been appropriate.',
    'For each item in grammarErrors and syntaxErrors, include both the problem and the corrected version.',
    'Use this format for grammarErrors and syntaxErrors items: "Issue: <what is wrong>. Correct: <correct sentence or phrase>."',
    'At least one actionable suggestion in improvementTips.',
    'You may use markdown for clarity (for example: "**Pronoun Clarity:** ...").',
    'If the user gives very short answer to social question, recommend extending and reciprocating naturally.',
    'Conversation history:',
    serializeRecentTurns(history),
    lastAssistantMessage ? `Last assistant message the user is responding to: "${lastAssistantMessage}"` : '',
    `Latest user message: ${userMessage}`,
  ].filter(Boolean).join('\n')
}
