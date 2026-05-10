import type { ConversationContext, ConversationTurn } from '../types/domain'

function serializeRecentTurns(turns: ConversationTurn[]): string {
  const recentTurns = turns.slice(-8)
  return recentTurns
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join('\n')
}

function summarizeAdaptiveTargets(turns: ConversationTurn[]): string {
  const analyzedUserTurns = turns.filter((turn) => turn.role === 'user' && turn.analysis)
  const recentWithFeedback = analyzedUserTurns.slice(-3)

  const targets = recentWithFeedback
    .map((turn, index) => {
      const analysis = turn.analysis
      if (!analysis) return null

      const grammar = analysis.grammarErrors.slice(0, 2).join(' | ')
      const syntax = analysis.syntaxErrors.slice(0, 2).join(' | ')
      const tips = analysis.improvementTips.slice(0, 2).join(' | ')

      const parts = [`Turn -${recentWithFeedback.length - index}: score ${analysis.score}/10`]
      if (grammar) parts.push(`Grammar issues: ${grammar}`)
      if (syntax) parts.push(`Syntax issues: ${syntax}`)
      if (tips) parts.push(`Improvement tips: ${tips}`)
      return parts.join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  return targets || 'No previous analyzed turns yet.'
}

export function buildStartPrompt(
  context: ConversationContext,
  coachStyle: string,
  userLanguage: string,
): string {
  return [
    'You are an English conversation partner helping the user practice writing.',
    `Conversation theme: ${context.topic}`,
    `Culture and style target: ${context.culture}`,
    `Coaching style: ${coachStyle}`,
    `User's native language: ${userLanguage}`,
    `IMPORTANT: Provide all feedback in ${userLanguage}. Even though the conversation is in English, the user learns better when feedback, explanations, and coaching are in their native language (${userLanguage}).`,
    context.adaptiveMode
      ? 'Adaptive mode: enabled. As the session evolves, guide the user toward practicing recurring weak points detected in feedback (for example verb tense control or missing detail).'
      : 'Adaptive mode: disabled. Keep a natural conversation flow without intentionally targeting weak points.',
    'Start the conversation with a single short message that invites a reply.',
    'Do not provide feedback yet. Just send the opening message.',
  ].join('\n')
}

export function buildEvaluationPrompt(args: {
  context: ConversationContext
  coachStyle: string
  history: ConversationTurn[]
  userMessage: string
  userLanguage: string
}): string {
  const { context, coachStyle, history, userMessage, userLanguage } = args

  const lastAssistantMessage = [...history].reverse().find((t) => t.role === 'assistant')?.content ?? null
  const adaptiveTargets = summarizeAdaptiveTargets(history)

  return [
    'You are both conversation partner and writing evaluator for English practice.',
    `Conversation theme: ${context.topic}`,
    `Culture and style target: ${context.culture}`,
    `Coaching style: ${coachStyle}`,
    `User's native language: ${userLanguage}`,
    `IMPORTANT: Provide all feedback, explanations, and tips in ${userLanguage}. The conversation is in English, but the user learns better when feedback is in their native language (${userLanguage}).`,
    context.adaptiveMode
      ? 'Adaptive mode: enabled. In assistantReply, guide the next exchange toward the user\'s weakest language areas identified in recent feedback while staying coherent with the conversation theme.'
      : 'Adaptive mode: disabled. Keep assistantReply naturally aligned with the conversation without targeted remediation steering.',
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
    `Scoring rubric: 3 = major issues or completely off-topic response, 6 = understandable with clear problems, 8 = strong with minor fixes, 10 = native-like and context-aware.`,
    'IMPORTANT: Before evaluating grammar and style, first check if the user\'s message is a relevant and coherent response to the last assistant message.',
    'If the user\'s response does not address or relate to what was asked or said, penalise the score heavily (score 3-4) and add a note in improvementTips explaining that the response is off-topic and describing what kind of reply would have been appropriate.',
    'For each item in grammarErrors and syntaxErrors, include both the problem and the corrected version.',
    `Use this format for grammarErrors and syntaxErrors items: "Issue: <what is wrong>. Correct: <correct sentence or phrase>." Always write these in ${userLanguage}.`,
    'At least one actionable suggestion in improvementTips.',
    'You may use markdown for clarity (for example: "**Pronoun Clarity:** ...").',
    'If the user gives very short answer to social question, recommend extending and reciprocating naturally.',
    context.adaptiveMode
      ? 'When adaptive mode is enabled, prioritize guided follow-up questions that force practice on weaknesses. Example: if tense usage is wrong, ask about a past or future event that requires the target tense; if detail is missing, ask for specific context (when, where, how, why, concrete examples).'
      : '',
    context.adaptiveMode ? 'Recent weakness targets from previous scored turns:' : '',
    context.adaptiveMode ? adaptiveTargets : '',
    'Conversation history:',
    serializeRecentTurns(history),
    lastAssistantMessage ? `Last assistant message the user is responding to: "${lastAssistantMessage}"` : '',
    `Latest user message: ${userMessage}`,
  ].filter(Boolean).join('\n')
}

export function buildSessionReviewPrompt(args: {
  context: ConversationContext
  coachStyle: string
  turns: ConversationTurn[]
  userLanguage: string
}): string {
  const { context, coachStyle, turns, userLanguage } = args

  const userTurns = turns.filter((t) => t.role === 'user' && t.analysis)

  const scoredReplies = userTurns
    .map((t, i) => {
      const a = t.analysis
      if (!a) return null
      const lines = [
        `--- Reply ${i + 1} (score ${a.score}/10) ---`,
        `Message: ${t.content}`,
        `Score rationale: ${a.scoreRationale}`,
      ]
      if (a.grammarErrors.length) lines.push(`Grammar errors: ${a.grammarErrors.join(' | ')}`)
      if (a.syntaxErrors.length) lines.push(`Syntax errors: ${a.syntaxErrors.join(' | ')}`)
      if (a.naturalnessNotes.length) lines.push(`Naturalness: ${a.naturalnessNotes.join(' | ')}`)
      if (a.improvementTips.length) lines.push(`Tips: ${a.improvementTips.join(' | ')}`)
      return lines.join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  return [
    'You are an English writing coach producing a final session review.',
    `Conversation theme: ${context.topic}`,
    `Culture and style target: ${context.culture}`,
    `Coaching style: ${coachStyle}`,
    `User's native language: ${userLanguage}`,
    `IMPORTANT: Write the entire session review in ${userLanguage}. The user learns better when feedback and analysis are in their native language (${userLanguage}).`,
    `Total user replies evaluated: ${userTurns.length}`,
    '',
    'Here are all scored replies from the session:',
    scoredReplies,
    '',
    'Based on ALL replies above, return ONLY valid JSON in this exact shape:',
    '{',
    '  "overallScore": <number 3-10, weighted average rounded to one decimal>,',
    `  "summary": "<2-3 sentence narrative overview of the user's performance in ${userLanguage}>",`,
    '  "strengths": ["<what the user consistently did well>"],',
    '  "areasToImprove": ["<recurring issues or patterns the user should work on>"],',
    '  "priorityFocus": ["<top 2-3 concrete practice recommendations for future sessions>"]',
    '}',
    'areasToImprove and priorityFocus must reference specific recurring patterns observed across replies, not just generic advice.',
    'If there are fewer than 2 user replies, still produce the review based on what is available.',
  ].join('\n')
}
