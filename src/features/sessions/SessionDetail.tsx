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

export function SessionDetail({ session, onBack }: SessionDetailProps) {
  return (
    <div className="session-detail">
      <div className="session-detail__header">
        <button type="button" className="session-detail__back" onClick={onBack}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{session.topic}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {session.culture} · {new Date(session.createdAt).toLocaleString()}
          </div>
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
