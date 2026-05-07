import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from '../types/domain'
import {
  exportSettings,
  importSettings,
  loadSettings,
  saveSettings,
} from './settingsStorage'

const SETTINGS_STORAGE_KEY = 'syntactic.settings.v1'
const store = new Map<string, string>()

const mockLocalStorage: Storage = {
  get length() {
    return store.size
  },
  clear() {
    store.clear()
  },
  getItem(key: string) {
    return store.get(key) ?? null
  },
  key(index: number) {
    return Array.from(store.keys())[index] ?? null
  },
  removeItem(key: string) {
    store.delete(key)
  },
  setItem(key: string, value: string) {
    store.set(key, value)
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
})

describe('settingsStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves and loads settings from localStorage', () => {
    const next = {
      ...DEFAULT_SETTINGS,
      model: 'qwen3:4b',
      temperature: 0.7,
    }

    saveSettings(next)

    expect(loadSettings()).toEqual(next)
  })

  it('falls back to defaults when storage payload is invalid', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{invalid-json')

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('exports and imports settings as JSON', () => {
    const next = {
      ...DEFAULT_SETTINGS,
      model: 'llama3.2:3b',
      speechEnabled: true,
    }

    const exported = exportSettings(next)
    const imported = importSettings(exported)

    expect(imported).toEqual(next)
    expect(loadSettings()).toEqual(next)
  })
})
