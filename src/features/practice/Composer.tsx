import { useRef, useCallback, type KeyboardEvent } from 'react'

interface ComposerProps {
  onSubmit: (value: string) => void
  disabled: boolean
  loading: boolean
}

export function Composer({ onSubmit, disabled, loading }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const value = ref.current?.value.trim()
    if (!value || disabled || loading) return
    onSubmit(value)
    if (ref.current) ref.current.value = ''
  }, [onSubmit, disabled, loading])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        submit()
      }
    },
    [submit],
  )

  return (
    <div className="composer">
      <div className="composer__field">
        <textarea
          ref={ref}
          className="composer__textarea"
          placeholder="Write your reply here…"
          disabled={disabled || loading}
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
            onClick={submit}
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
