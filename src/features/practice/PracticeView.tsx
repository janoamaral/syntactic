import { useEffect, useRef } from 'react'
import type { ConversationTurn } from '../../types/domain'

interface PracticeViewProps {
  turns: ConversationTurn[]
  loading: boolean
  error: string | null
  onClearError: () => void
}

function scoreBadgeClass(score: number): string {
  if (score >= 8) return 'turn__score-badge--high'
  if (score >= 6) return 'turn__score-badge--mid'
  return 'turn__score-badge--low'
}

export function PracticeView({ turns, loading, error, onClearError }: PracticeViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, loading])

  return (
    <div className="conversation-thread">
      {turns.map((turn) => (
        <div key={turn.id} className={`turn turn--${turn.role}`}>
          <div className="turn__bubble">{turn.content}</div>
          {turn.role === 'user' && turn.analysis && (
            <span className={`turn__score-badge ${scoreBadgeClass(turn.analysis.score)}`}>
              ★ {turn.analysis.score}/10
            </span>
          )}
        </div>
      ))}

      {loading && (
        <div className="turn turn--assistant">
          <div className="typing-indicator" aria-label="Thinking…">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠ {error}</span>
          <button type="button" onClick={onClearError} aria-label="Dismiss error">
            ✕
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
