export interface SpeechInputAdapter {
  readonly isAvailable: boolean
  startCapture(): Promise<void>
  stopCapture(): Promise<void>
  onPartialResult?(callback: (value: string) => void): void
  onFinalResult?(callback: (value: string) => void): void
}

export class DisabledSpeechAdapter implements SpeechInputAdapter {
  readonly isAvailable = false

  async startCapture(): Promise<void> {
    throw new Error('Speech capture is intentionally disabled in this MVP.')
  }

  async stopCapture(): Promise<void> {
    return
  }
}
