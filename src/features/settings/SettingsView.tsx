import { useCallback, useRef, useState } from 'react'
import type { AppSettings } from '../../types/domain'
import { TOPIC_OPTIONS, CULTURE_OPTIONS } from '../../types/domain'
import { exportSettings, importSettings } from '../../storage/settingsStorage'

interface SettingsViewProps {
  settings: AppSettings
  onSave: (next: AppSettings) => void
}

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'qwen', label: 'Qwen (Dashscope)' },
] as const

export function SettingsView({ settings, onSave }: SettingsViewProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings })
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const handleSave = useCallback(() => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [form, onSave])

  const handleExport = useCallback(() => {
    const json = exportSettings(form)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'syntactic-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [form])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = importSettings(reader.result as string)
          setForm(imported)
          onSave(imported)
          setSaved(true)
          setImportError(null)
          setTimeout(() => setSaved(false), 2500)
        } catch {
          setImportError('Invalid config file. Please check the JSON format and try again.')
        }
      }
      reader.readAsText(file)
      // reset file input so same file can be re-imported
      e.target.value = ''
    },
    [onSave],
  )

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Settings</h1>
          <p className="view-subtitle">Configure your AI provider and practice defaults</p>
        </div>
      </div>

      <div className="settings-form">
        {/* ── Provider ── */}
        <div className="settings-section">
          <div className="settings-section__title">LLM Provider</div>

          <div className="form-group">
            <label className="form-label" htmlFor="provider-select">
              Provider
            </label>
            <select
              id="provider-select"
              className="form-select"
              value={form.provider}
              onChange={(e) => set('provider', e.target.value as AppSettings['provider'])}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {form.provider !== 'ollama' && (
              <span className="form-hint">
                ⚠ This provider is a placeholder. Ollama is the only fully implemented provider in this MVP.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="model-input">
              Model name
            </label>
            <input
              id="model-input"
              className="form-input"
              type="text"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              placeholder="e.g. llama3.1:8b"
            />
          </div>

          {form.provider === 'ollama' && (
            <div className="form-group">
              <label className="form-label" htmlFor="base-url-input">
                Ollama base URL
              </label>
              <input
                id="base-url-input"
                className="form-input"
                type="url"
                value={form.ollamaBaseUrl}
                onChange={(e) => set('ollamaBaseUrl', e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
          )}

          {form.provider !== 'ollama' && (
            <div className="form-group">
              <label className="form-label" htmlFor="api-key-input">
                API key
              </label>
              <input
                id="api-key-input"
                className="form-input"
                type="password"
                value={form.apiKey}
                onChange={(e) => set('apiKey', e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
              />
              <span className="form-hint">Stored locally in localStorage — not sent to any server other than the provider.</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="temperature-range">
              Temperature — {form.temperature}
            </label>
            <div className="range-row">
              <input
                id="temperature-range"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={form.temperature}
                onChange={(e) => set('temperature', parseFloat(e.target.value))}
              />
              <span className="range-value">{form.temperature}</span>
            </div>
            <span className="form-hint">Lower = more focused; higher = more creative</span>
          </div>
        </div>

        {/* ── Practice defaults ── */}
        <div className="settings-section">
          <div className="settings-section__title">Practice defaults</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="default-topic">
                Default topic
              </label>
              <select
                id="default-topic"
                className="form-select"
                value={form.defaultTopic}
                onChange={(e) => set('defaultTopic', e.target.value)}
              >
                {TOPIC_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="default-culture">
                Default culture
              </label>
              <select
                id="default-culture"
                className="form-select"
                value={form.defaultCulture}
                onChange={(e) => set('defaultCulture', e.target.value)}
              >
                {CULTURE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="coach-style">
              Coach style
            </label>
            <textarea
              id="coach-style"
              className="form-textarea"
              value={form.coachStyle}
              onChange={(e) => set('coachStyle', e.target.value)}
              rows={3}
            />
            <span className="form-hint">
              Describes the feedback tone injected into every prompt.
            </span>
          </div>
        </div>

        {/* ── Config import / export ── */}
        <div className="settings-section">
          <div className="settings-section__title">Config backup</div>

          {importError && (
            <div className="error-banner" role="alert" style={{ marginBottom: 16 }}>
              <span>{importError}</span>
              <button type="button" onClick={() => setImportError(null)} aria-label="Dismiss">✕</button>
            </div>
          )}

          <div className="settings-actions">
            <button type="button" className="btn-secondary" onClick={handleExport}>
              ↓ Export config
            </button>

            <label className="import-label" htmlFor="import-file">
              ↑ Import config
              <input
                ref={fileRef}
                id="import-file"
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </label>
          </div>
          <p className="form-hint" style={{ marginTop: 10 }}>
            Only settings are exported (provider, model, coach style). Session history stays in IndexedDB and is not exported.
          </p>
        </div>

        {/* ── Save bar ── */}
        <div className="settings-save-bar">
          <button type="button" className="btn-primary" style={{ width: 'auto', marginTop: 0, padding: '10px 28px' }} onClick={handleSave}>
            Save settings
          </button>
          {saved && (
            <span className="settings-saved">
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
