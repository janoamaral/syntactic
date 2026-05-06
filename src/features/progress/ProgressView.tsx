import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { PracticeSession } from '../../types/domain'
import { listSessions, getSessionAverageScore, extractScorePoints } from '../../storage/sessionDb'

interface ChartPoint {
  date: string
  avg: number
  topic: string
}

interface TurnChartPoint {
  turn: number
  score: number
  topic: string
}

export function ProgressView() {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  const sessionData: ChartPoint[] = useMemo(
    () =>
      sessions
        .filter((s) => getSessionAverageScore(s) > 0)
        .map((s) => ({
          date: new Date(s.createdAt).toLocaleDateString(),
          avg: getSessionAverageScore(s),
          topic: s.topic,
        }))
        .reverse(),
    [sessions],
  )

  const allTurnPoints: TurnChartPoint[] = useMemo(() => {
    const points: TurnChartPoint[] = []
    const sorted = [...sessions].reverse()
    let counter = 1
    for (const s of sorted) {
      for (const p of extractScorePoints(s)) {
        points.push({ turn: counter++, score: p.score, topic: s.topic })
      }
    }
    return points
  }, [sessions])

  const totalSessions = sessions.length
  const totalReplies = useMemo(
    () => sessions.reduce((acc, s) => acc + s.turns.filter((t) => t.role === 'user').length, 0),
    [sessions],
  )
  const overallAvg = useMemo(() => {
    const avgs = sessions.map(getSessionAverageScore).filter((a) => a > 0)
    if (!avgs.length) return 0
    return Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1))
  }, [sessions])
  const best = useMemo(
    () =>
      Math.max(
        0,
        ...sessions.flatMap((s) => extractScorePoints(s).map((p) => p.score)),
      ),
    [sessions],
  )

  if (loading) {
    return (
      <div className="view-container">
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  if (totalSessions === 0) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1 className="view-title">Progress</h1>
        </div>
        <div className="progress-empty">
          <span style={{ fontSize: 40, opacity: 0.2 }}>📈</span>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Complete at least one practice session to see your progress charts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Progress</h1>
          <p className="view-subtitle">Your writing improvement over time</p>
        </div>
      </div>

      {/* Stats */}
      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-card__label">Sessions</div>
          <div className="stat-card__value">{totalSessions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total replies</div>
          <div className="stat-card__value">{totalReplies}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Overall avg</div>
          <div
            className="stat-card__value"
            style={{
              color:
                overallAvg >= 8
                  ? 'var(--success)'
                  : overallAvg >= 6
                  ? 'var(--warning)'
                  : 'var(--error)',
            }}
          >
            {overallAvg || '—'}
          </div>
          <div className="stat-card__sub">out of 10</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Best score</div>
          <div className="stat-card__value" style={{ color: 'var(--success)' }}>
            {best || '—'}
          </div>
        </div>
      </div>

      {/* Session average trend */}
      {sessionData.length > 0 && (
        <div className="chart-card">
          <div className="chart-card__title">Session average score</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sessionData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis domain={[3, 10]} tick={{ fill: '#666', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#999', fontSize: 12 }}
                itemStyle={{ color: '#f0f0f0' }}
              />
              <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: 'Good', fill: '#22c55e', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="avg"
                name="Avg score"
                stroke="#e8431a"
                strokeWidth={2}
                dot={{ fill: '#e8431a', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-turn score evolution */}
      {allTurnPoints.length > 1 && (
        <div className="chart-card">
          <div className="chart-card__title">Score per reply (all sessions)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={allTurnPoints} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="turn" tick={{ fill: '#666', fontSize: 11 }} label={{ value: 'Reply #', fill: '#555', fontSize: 10, position: 'insideBottomRight', offset: -4 }} />
              <YAxis domain={[3, 10]} tick={{ fill: '#666', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#999', fontSize: 12 }}
                itemStyle={{ color: '#f0f0f0' }}
                formatter={(v) => [v, 'Score']}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
