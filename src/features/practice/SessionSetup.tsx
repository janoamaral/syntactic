import { useState } from 'react'
import type { AppSettings } from '../../types/domain'
import { TOPIC_OPTIONS, CULTURE_OPTIONS } from '../../types/domain'
import type { ConversationContext } from '../../types/domain'

interface SessionSetupProps {
  settings: AppSettings
  onStart: (context: ConversationContext) => void
  loading: boolean
}

export function SessionSetup({ settings, onStart, loading }: SessionSetupProps) {
  const [topic, setTopic] = useState(settings.defaultTopic)
  const [culture, setCulture] = useState(settings.defaultCulture)

  return (
    <div className="session-setup">
      <div className="session-setup__card">
        <h1 className="session-setup__tagline">
          Ask your data<span> anything_</span>
        </h1>
        <p className="session-setup__subtitle">
          Choose a topic and culture to start your English writing practice session.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="topic-select">
            Conversation topic
          </label>
          <select
            id="topic-select"
            className="form-select"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          >
            {TOPIC_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="culture-select">
            Language &amp; culture
          </label>
          <select
            id="culture-select"
            className="form-select"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            disabled={loading}
          >
            {CULTURE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={() => onStart({ topic, culture })}
        >
          {loading ? (
            <>
              <span aria-hidden="true">⏳</span> Starting…
            </>
          ) : (
            <>
              <span aria-hidden="true">⚡</span> Start practice
            </>
          )}
        </button>
      </div>
    </div>
  )
}
