import { useEffect, useState } from 'react'
import type { PracticeSession } from '../../types/domain'
import { listSessions, getSessionAverageScore, deleteSession } from '../../storage/sessionDb'
import { SessionDetail } from './SessionDetail'

interface SessionsViewProps {
  readonly onResume: (session: PracticeSession) => void
  readonly onNotify: (message: string) => void
}

export function SessionsView({ onResume, onNotify }: SessionsViewProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PracticeSession | null>(null)

  const reload = () => {
    listSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!globalThis.confirm('Delete this session? This cannot be undone.')) return
    await deleteSession(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (selected?.id === sessionId) setSelected(null)
    onNotify('Session deleted')
  }

  if (selected) {
    return (
      <SessionDetail
        session={selected}
        onBack={() => setSelected(null)}
        onResume={() => onResume(selected)}
        onNotify={onNotify}
        onDelete={async () => {
          await deleteSession(selected.id)
          setSessions((prev) => prev.filter((s) => s.id !== selected.id))
          setSelected(null)
          onNotify('Session deleted')
        }}
      />
    )
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Sessions</h1>
          <p className="view-subtitle">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="sessions-empty">
          <span className="sessions-empty__icon">📋</span>
          <p className="sessions-empty__text">
            No sessions yet. Start a practice session to see your history here.
          </p>
        </div>
      ) : (
        <ul className="sessions-list" role="list">
          {sessions.map((s) => {
            const avg = getSessionAverageScore(s)
            const sc = avg >= 8 ? 'var(--success)' : avg >= 6 ? 'var(--warning)' : 'var(--error)'
            const turns = s.turns.filter((t) => t.role === 'user').length
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className="session-card"
                  onClick={() => setSelected(s)}
                >
                  <div className="session-card__top">
                    <div>
                      <div className="session-card__topic">{s.topic}</div>
                      <div className="session-card__culture">{s.culture}</div>
                    </div>
                    {avg > 0 && (
                      <div className="session-card__score" style={{ color: sc }}>
                        {avg}
                      </div>
                    )}
                  </div>
                  <div className="session-card__meta">
                    <span>📅 {new Date(s.createdAt).toLocaleDateString()}</span>
                    <span>💬 {turns} reply{turns !== 1 ? 's' : ''}</span>
                    <span className="tag">{s.provider}</span>
                  </div>
                </button>
                <div className="session-card__actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onResume(s)}
                    title="Resume this session"
                  >
                    ▶ Resume
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={(e) => handleDelete(e, s.id)}
                    title="Delete this session"
                  >
                    🗑 Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
