import type { AppSettings } from '../../types/domain'
import { usePracticeSession } from './usePracticeSession'
import { SessionSetup } from './SessionSetup'
import { PracticeView } from './PracticeView'
import { Composer } from './Composer'
import { FeedbackPanel } from './FeedbackPanel'

interface PracticeLayoutProps {
  settings: AppSettings
}

export function PracticeLayout({ settings }: PracticeLayoutProps) {
  const {
    phase,
    session,
    latestAnalysis,
    error,
    startSession,
    submitUserTurn,
    resetSession,
    clearError,
  } = usePracticeSession(settings)

  const isLoading = phase === 'loading' || phase === 'starting'
  const isActive = phase === 'active' || phase === 'loading'

  return (
    <>
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
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetSession}
                title="End session and start a new one"
              >
                ✕ End session
              </button>
            </div>

            <PracticeView
              turns={session?.turns ?? []}
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
        <FeedbackPanel analysis={latestAnalysis} session={session} />
      </aside>
    </>
  )
}
