import { useMemo, useState } from 'react'
import type { PracticeSession } from '../../types/domain'

interface SessionDetailProps {
  session: PracticeSession
  onBack: () => void
}

function scoreBadgeClass(score: number): string {
  if (score >= 8) return 'turn__score-badge--high'
  if (score >= 6) return 'turn__score-badge--mid'
  return 'turn__score-badge--low'
}

const LLM_HANDOFF_PROMPT = [
  'You are an English writing coach reviewing a conversation between a user and another LLM.',
  'Use the YAML data below as the source of truth.',
  'Tasks:',
  '1. Evaluate user progression across replies.',
  '2. Compare your scoring with the existing per-reply scores.',
  '3. Highlight grammar/syntax/naturalness patterns.',
  '4. Provide concrete rewrites for weaker user responses.',
  '5. End with a short improvement plan for the next practice session.',
].join('\n')

function quoteYaml(value: string): string {
  return JSON.stringify(value)
}

function toYamlBlock(value: string, indent: number): string[] {
  const prefix = ' '.repeat(indent)
  const lines = value.split(/\r?\n/)
  if (lines.length === 0) {
    return [`${prefix}`]
  }
  return lines.map((line) => `${prefix}${line}`)
}

function toYamlArray(items: string[], indent: number): string[] {
  const prefix = ' '.repeat(indent)
  if (items.length === 0) {
    return [`${prefix}[]`]
  }
  return items.map((item) => `${prefix}- ${quoteYaml(item)}`)
}

function getConversationYaml(session: PracticeSession): string {
  const userTurns = session.turns.filter((turn) => turn.role === 'user')
  const scoredTurns = userTurns.filter((turn) => Boolean(turn.analysis))
  const averageScore =
    scoredTurns.length > 0
      ? Number(
          (
            scoredTurns.reduce((acc, turn) => acc + (turn.analysis?.score ?? 0), 0) /
            scoredTurns.length
          ).toFixed(2),
        )
      : null

  const lines: string[] = [
    'version: 1',
    `generated_at: ${quoteYaml(new Date().toISOString())}`,
    'llm_handoff_prompt: |-',
    ...toYamlBlock(LLM_HANDOFF_PROMPT, 2),
    'session:',
    `  id: ${quoteYaml(session.id)}`,
    `  created_at: ${quoteYaml(session.createdAt)}`,
    `  updated_at: ${quoteYaml(session.updatedAt)}`,
    `  topic: ${quoteYaml(session.topic)}`,
    `  culture: ${quoteYaml(session.culture)}`,
    `  provider: ${quoteYaml(session.provider)}`,
    `  model: ${quoteYaml(session.model)}`,
    `  total_turns: ${session.turns.length}`,
    `  user_replies: ${userTurns.length}`,
    `  scored_user_replies: ${scoredTurns.length}`,
    `  average_user_score: ${averageScore ?? 'null'}`,
    'conversation:',
  ]

  session.turns.forEach((turn, index) => {
    const role = turn.role === 'assistant' ? 'llm' : 'user'

    lines.push(`  - index: ${index + 1}`)
    lines.push(`    turn_id: ${quoteYaml(turn.id)}`)
    lines.push(`    role: ${quoteYaml(role)}`)
    lines.push(`    timestamp: ${quoteYaml(turn.createdAt)}`)
    lines.push('    message: |-')
    lines.push(...toYamlBlock(turn.content, 6))

    if (turn.role === 'user' && turn.analysis) {
      lines.push('    evaluation:')
      lines.push(`      score: ${turn.analysis.score}`)
      lines.push(`      score_rationale: ${quoteYaml(turn.analysis.scoreRationale)}`)
      lines.push('      grammar_errors:')
      lines.push(...toYamlArray(turn.analysis.grammarErrors, 8))
      lines.push('      syntax_errors:')
      lines.push(...toYamlArray(turn.analysis.syntaxErrors, 8))
      lines.push('      naturalness_notes:')
      lines.push(...toYamlArray(turn.analysis.naturalnessNotes, 8))
      lines.push('      improvement_tips:')
      lines.push(...toYamlArray(turn.analysis.improvementTips, 8))
    } else {
      lines.push('    evaluation: null')
    }
  })

  return lines.join('\n')
}

function sanitizeFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}

export function SessionDetail({ session, onBack }: SessionDetailProps) {
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const yamlContent = useMemo(() => getConversationYaml(session), [session])

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent)
      setExportStatus('YAML copied to clipboard')
    } catch {
      setExportStatus('Clipboard not available in this browser')
    }
  }

  const handleDownloadYaml = () => {
    const topic = sanitizeFilenamePart(session.topic) || 'session'
    const createdAt = new Date(session.createdAt).toISOString().slice(0, 10)
    const fileName = `syntactic-${topic}-${createdAt}.yaml`

    const blob = new Blob([yamlContent], { type: 'application/x-yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    setExportStatus(`Downloaded ${fileName}`)
  }

  return (
    <div className="session-detail">
      <div className="session-detail__header">
        <div>
          <button type="button" className="session-detail__back" onClick={onBack}>
            ← Back
          </button>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 8 }}>{session.topic}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {session.culture} · {new Date(session.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="session-detail__actions">
          <button type="button" className="btn-secondary" onClick={handleCopyYaml}>
            Copy YAML
          </button>
          <button type="button" className="btn-secondary" onClick={handleDownloadYaml}>
            Download YAML
          </button>
          {exportStatus && <span className="session-detail__export-status">{exportStatus}</span>}
        </div>
      </div>

      <div className="session-detail__thread">
        {session.turns.map((turn) => (
          <div key={turn.id} className={`turn turn--${turn.role}`}>
            <div className="turn__bubble">{turn.content}</div>
            {turn.role === 'user' && turn.analysis && (
              <>
                <span className={`turn__score-badge ${scoreBadgeClass(turn.analysis.score)}`}>
                  ★ {turn.analysis.score}/10
                </span>
                <div className="replay-analysis">
                  <div className="replay-analysis__score">
                    Score {turn.analysis.score}/10 — {turn.analysis.scoreRationale}
                  </div>
                  {turn.analysis.grammarErrors.length > 0 && (
                    <div>
                      <strong>Grammar:</strong> {turn.analysis.grammarErrors.join('; ')}
                    </div>
                  )}
                  {turn.analysis.syntaxErrors.length > 0 && (
                    <div>
                      <strong>Syntax:</strong> {turn.analysis.syntaxErrors.join('; ')}
                    </div>
                  )}
                  {turn.analysis.naturalnessNotes.length > 0 && (
                    <div>
                      <strong>Naturalness:</strong> {turn.analysis.naturalnessNotes.join('; ')}
                    </div>
                  )}
                  {turn.analysis.improvementTips.length > 0 && (
                    <div>
                      <strong>Tips:</strong> {turn.analysis.improvementTips.join('; ')}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
