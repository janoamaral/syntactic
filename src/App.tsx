import { useState, useCallback, useRef } from 'react'
import type { AppView, AppSettings, PracticeSession } from './types/domain'
import { loadSettings, saveSettings } from './storage/settingsStorage'
import { PracticeLayout } from './features/practice/PracticeLayout'
import { SessionsView } from './features/sessions/SessionsView'
import { ProgressView } from './features/progress/ProgressView'
import { SettingsView } from './features/settings/SettingsView'
import './styles/app.css'

const NAV_ITEMS: { view: AppView; label: string; icon: string }[] = [
  { view: 'practice', label: 'Practice', icon: '🏠' },
  { view: 'sessions', label: 'Sessions', icon: '📋' },
  { view: 'progress', label: 'Progress', icon: '📈' },
  { view: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [view, setView] = useState<AppView>('practice')
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [sessionToResume, setSessionToResume] = useState<PracticeSession | null>(null)
  const [snackMessage, setSnackMessage] = useState<string | null>(null)
  const [snackLeaving, setSnackLeaving] = useState(false)
  const snackTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const snackHideTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  const showSnack = useCallback((message: string) => {
    if (snackHideTimeoutRef.current) {
      globalThis.clearTimeout(snackHideTimeoutRef.current)
      snackHideTimeoutRef.current = null
    }
    setSnackLeaving(false)
    setSnackMessage(message)
    if (snackTimeoutRef.current) {
      globalThis.clearTimeout(snackTimeoutRef.current)
    }
    snackTimeoutRef.current = globalThis.setTimeout(() => {
      setSnackLeaving(true)
      snackTimeoutRef.current = null
      snackHideTimeoutRef.current = globalThis.setTimeout(() => {
        setSnackMessage(null)
        setSnackLeaving(false)
        snackHideTimeoutRef.current = null
      }, 340)
    }, 2600)
  }, [])

  const handleSettingsChange = useCallback((next: AppSettings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const handleNewPractice = useCallback(() => {
    setSessionToResume(null)
    setView('practice')
  }, [])

  const handleResume = useCallback((session: PracticeSession) => {
    setSessionToResume(session)
    setView('practice')
  }, [])

  return (
    <div className={`app-layout${view !== 'practice' ? ' app-layout--no-right' : ''}`}>
      {/* ── Left sidebar ── */}
      <nav className="sidebar-left">
        <div className="sidebar-brand">
          <div className="brand-dot" aria-hidden="true" />
          <span className="brand-name">SYNTACTIC</span>
        </div>

        <button className="btn-new" onClick={handleNewPractice} type="button">
          NEW <span aria-hidden="true">⚡</span>
        </button>

        <ul className="nav-list" role="list">
          {NAV_ITEMS.map(({ view: v, label, icon }) => (
            <li key={v}>
              <button
                type="button"
                className={`nav-item${view === v ? ' nav-item--active' : ''}`}
                onClick={() => setView(v)}
                aria-current={view === v ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">v{APP_VERSION}</div>
      </nav>

      {/* ── Center (+ optional right panel) ── */}
      {view === 'practice' ? (
        <PracticeLayout settings={settings} sessionToResume={sessionToResume} onResumeConsumed={() => setSessionToResume(null)} />
      ) : (
        <main className="center-panel">
          {view === 'sessions' && <SessionsView onResume={handleResume} onNotify={showSnack} />}
          {view === 'progress' && <ProgressView />}
          {view === 'settings' && (
            <SettingsView settings={settings} onSave={handleSettingsChange} onNotify={showSnack} />
          )}
        </main>
      )}
      {snackMessage && (
        <div
          className={`app-snackbar${snackLeaving ? ' app-snackbar--leaving' : ''}`}
          role="status"
          aria-live="polite"
        >
          {snackMessage}
        </div>
      )}
    </div>
  )
}

const APP_VERSION = '0.1.0'
