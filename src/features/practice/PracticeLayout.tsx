import { useEffect, useMemo, useState } from 'react'
import type { AppSettings, PracticeSession } from '../../types/domain'
import { usePracticeSession } from './usePracticeSession'
import { SessionSetup } from './SessionSetup'
import { PracticeView } from './PracticeView'
import { Composer } from './Composer'
import { FeedbackPanel } from './FeedbackPanel'
import { SessionReviewModal } from './SessionReviewModal'

interface PracticeLayoutProps {
  readonly settings: AppSettings
  readonly sessionToResume?: PracticeSession | null
  readonly onResumeConsumed?: () => void
}

export function PracticeLayout({ settings, sessionToResume, onResumeConsumed }: PracticeLayoutProps) {
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null)

  const {
    phase,
    session,
    sessionReview,
    error,
    startSession,
    resumeSession,
    setAdaptiveMode,
    submitUserTurn,
    finishSession,
    resetSession,
    clearError,
  } = usePracticeSession(settings)

  useEffect(() => {
    if (sessionToResume) {
      resumeSession(sessionToResume)
      onResumeConsumed?.()
    }
  }, [sessionToResume, resumeSession, onResumeConsumed])

  const userTurns = useMemo(
    () => (session?.turns ?? []).filter((turn) => turn.role === 'user' && turn.analysis),
    [session?.turns],
  )

  const selectedAnalysis = useMemo(() => {
    if (!selectedTurnId) return null
    return userTurns.find((turn) => turn.id === selectedTurnId)?.analysis ?? null
  }, [selectedTurnId, userTurns])

  const selectedTurnContent = useMemo(() => {
    if (!selectedTurnId) return null
    return userTurns.find((turn) => turn.id === selectedTurnId)?.content ?? null
  }, [selectedTurnId, userTurns])

  useEffect(() => {
    if (userTurns.length === 0) {
      setSelectedTurnId(null)
      return
    }

    setSelectedTurnId(userTurns[userTurns.length - 1].id)
  }, [userTurns])

  const isLoading = phase === 'loading' || phase === 'starting'
  const isReviewing = phase === 'reviewing'
  const isActive = phase === 'active' || phase === 'loading' || isReviewing

  return (
    <>
      {sessionReview && (
        <SessionReviewModal
          review={sessionReview}
          onClose={resetSession}
        />
      )}
      {/* ── Center column ── */}
      <main className="center-panel">
        {!isActive ? (
          <SessionSetup
            settings={settings}
            onStart={startSession}
            loading={phase === 'starting'}
          />
        ) : (
          <div className="conversation-area">
            <div className="conversation-header">
              <div className="conversation-header__meta">
                <div className="conversation-header__title">{session?.topic}</div>
                <div className="conversation-header__subtitle">{session?.culture}</div>
                {session?.adaptiveMode && (
                  <div className="conversation-header__badge">Adaptive mode enabled</div>
                )}
              </div>
              <div className="conversation-header__actions">
                <button
                  type="button"
                  className={`btn-secondary ${session?.adaptiveMode ? 'btn-secondary--active' : ''}`}
                  onClick={() => {
                    void setAdaptiveMode(!(session?.adaptiveMode ?? false))
                  }}
                  disabled={isReviewing || isLoading}
                  title="Enable or disable adaptive mode during this session"
                >
                  {session?.adaptiveMode ? 'Adaptive: ON' : 'Adaptive: OFF'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={finishSession}
                  disabled={isReviewing || isLoading}
                  title="End session and get your final review"
                >
                  {isReviewing ? '⏳ Reviewing…' : '✕ End session'}
                </button>
              </div>
            </div>

            <PracticeView
              turns={session?.turns ?? []}
              selectedTurnId={selectedTurnId}
              onSelectTurn={setSelectedTurnId}
              loading={isLoading}
              error={error}
              onClearError={clearError}
            />

            <Composer
              onSubmit={submitUserTurn}
              disabled={!isActive}
              loading={isLoading}
            />
          </div>
        )}
      </main>

      {/* ── Right column (feedback) ── */}
      <aside className="sidebar-right">
        <FeedbackPanel
          analysis={selectedAnalysis}
          session={session}
          selectedReply={selectedTurnContent}
        />
      </aside>
    </>
  )
}
