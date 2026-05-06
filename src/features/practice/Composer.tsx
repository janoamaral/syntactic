import { useState, useCallback, type KeyboardEvent } from 'react'

interface ComposerProps {
  onSubmit: (value: string) => Promise<boolean>
  disabled: boolean
  loading: boolean
}

export function Composer({ onSubmit, disabled, loading }: ComposerProps) {
  const [value, setValue] = useState('')

  const submit = useCallback(async () => {
    const trimmedValue = value.trim()
    if (!trimmedValue || disabled || loading) return false

    const submitted = await onSubmit(trimmedValue)
    if (submitted) {
      setValue('')
    }
    return submitted
  }, [value, onSubmit, disabled, loading])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        void submit()
      }
    },
    [submit],
  )

  return (
    <div className="composer">
      <div className="composer__field">
        <textarea
          className="composer__textarea"
          placeholder="Write your reply here…"
          value={value}
          disabled={disabled || loading}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Your message"
        />
        <div className="composer__footer">
          <span className="composer__hint">
            {loading ? 'Waiting for feedback…' : 'Ctrl + Enter to send'}
          </span>
          <button
            type="button"
            className="composer__send"
            onClick={() => void submit()}
            disabled={disabled || loading}
            aria-label="Send message"
          >
            {loading ? (
              <>
                <span aria-hidden="true">⏳</span> Analysing…
              </>
            ) : (
              <>
                Send <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
