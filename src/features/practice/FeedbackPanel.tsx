import { useMemo } from 'react'
import type { FeedbackAnalysis, PracticeSession } from '../../types/domain'
import { getSessionAverageScore } from '../../storage/sessionDb'

interface FeedbackPanelProps {
  analysis: FeedbackAnalysis | null
  session: PracticeSession | null
}

function scoreClass(score: number): string {
  if (score >= 8) return 'high'
  if (score >= 6) return 'mid'
  return 'low'
}

export function FeedbackPanel({ analysis, session }: FeedbackPanelProps) {
  const avgScore = useMemo(
    () => (session ? getSessionAverageScore(session) : 0),
    [session],
  )

  if (!analysis) {
    return (
      <div className="feedback-panel">
        <div className="feedback-panel__empty">
          <span className="feedback-panel__empty-icon">💬</span>
          <p className="feedback-panel__empty-text">
            Send your first reply to see feedback and your score here.
          </p>
        </div>
      </div>
    )
  }

  const sc = scoreClass(analysis.score)
  const avgSc = scoreClass(avgScore)

  return (
    <div className="feedback-panel">
      {/* Score block */}
      <div className="score-block">
        <div className="score-block__row">
          <span className="score-block__label">Last score</span>
          {session && (
            <div style={{ textAlign: 'right' }}>
              <div className="score-block__label">Session avg</div>
              <div className={`score-avg score-avg--${avgSc}`}>{avgScore}</div>
            </div>
          )}
        </div>
        <div className={`score-number score-number--${sc}`}>{analysis.score}<span style={{ fontSize: 16, color: 'var(--text-3)' }}>/10</span></div>
        <p className="score-rationale">{analysis.scoreRationale}</p>
      </div>

      {/* Grammar errors */}
      <FeedbackSection
        title="Grammar"
        tag="error"
        items={analysis.grammarErrors}
        emptyText="No grammar errors detected."
        itemClass="feedback-item--error"
      />

      {/* Syntax errors */}
      <FeedbackSection
        title="Syntax"
        tag="error"
        items={analysis.syntaxErrors}
        emptyText="No syntax errors detected."
        itemClass="feedback-item--error"
      />

      {/* Naturalness */}
      <FeedbackSection
        title="Naturalness"
        tag="warn"
        items={analysis.naturalnessNotes}
        emptyText="Sounds natural!"
        itemClass="feedback-item--warn"
      />

      {/* Tips */}
      <FeedbackSection
        title="Tips to improve"
        tag="tip"
        items={analysis.improvementTips}
        emptyText="Nothing to improve — great job!"
        itemClass="feedback-item--tip"
      />
    </div>
  )
}

interface FeedbackSectionProps {
  title: string
  tag: 'error' | 'warn' | 'tip' | 'ok'
  items: string[]
  emptyText: string
  itemClass: string
}

function FeedbackSection({ title, tag, items, emptyText, itemClass }: FeedbackSectionProps) {
  return (
    <div className="feedback-section">
      <div className="feedback-section__title">
        <span className={`feedback-tag feedback-tag--${tag}`} aria-hidden="true" />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="feedback-empty">{emptyText}</p>
      ) : (
        <ul className="feedback-list" role="list">
          {items.map((item, i) => (
            <li key={i} className={`feedback-item ${itemClass}`}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
