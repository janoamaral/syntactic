import ReactMarkdown from 'react-markdown'
import type { SessionReview } from '../../types/domain'

interface SessionReviewModalProps {
  readonly review: SessionReview
  readonly onClose: () => void
}

function scoreClass(score: number): string {
  if (score >= 8) return 'high'
  if (score >= 6) return 'mid'
  return 'low'
}

export function SessionReviewModal({ review, onClose }: SessionReviewModalProps) {
  const sc = scoreClass(review.overallScore)

  return (
    <div className="modal-backdrop">
      <dialog open className="modal" aria-label="Session review">
        <div className="modal__header">
          <h2 className="modal__title">Session Review</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close review"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* Overall score */}
          <div className="score-block">
            <div className="score-block__label">Overall score</div>
            <div className={`score-number score-number--${sc}`}>
              {review.overallScore}
              <span className="score-number__denom">/10</span>
            </div>
            <div className="score-rationale">
              <ReactMarkdown>{review.summary}</ReactMarkdown>
            </div>
          </div>

          {/* Strengths */}
          {review.strengths.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-section__title">
                <span className="feedback-tag feedback-tag--tip" aria-hidden="true" />
                {' '}What you did well
              </div>
              <ul className="feedback-list" role="list">
                {review.strengths.map((item, i) => (
                  <li key={i} className="feedback-item feedback-item--tip">
                    <ReactMarkdown>{item}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {review.areasToImprove.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-section__title">
                <span className="feedback-tag feedback-tag--warn" aria-hidden="true" />
                {' '}Areas to improve
              </div>
              <ul className="feedback-list" role="list">
                {review.areasToImprove.map((item, i) => (
                  <li key={i} className="feedback-item feedback-item--warn">
                    <ReactMarkdown>{item}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Priority focus */}
          {review.priorityFocus.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-section__title">
                <span className="feedback-tag feedback-tag--error" aria-hidden="true" />
                {' '}Practice for next sessions
              </div>
              <ul className="feedback-list" role="list">
                {review.priorityFocus.map((item, i) => (
                  <li key={i} className="feedback-item feedback-item--error">
                    <ReactMarkdown>{item}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Start new session
          </button>
        </div>
      </dialog>
    </div>
  )
}
