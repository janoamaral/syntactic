import { DEFAULT_SETTINGS } from '../types/domain'
import type { AppSettings } from '../types/domain'
import { parseSettings } from '../utils/schema'

const SETTINGS_STORAGE_KEY = 'syntactic.settings.v1'

export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_SETTINGS
  }

  try {
    const parsed = parseSettings(JSON.parse(raw))
    return parsed
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function exportSettings(settings: AppSettings): string {
  return JSON.stringify(settings, null, 2)
}

export function importSettings(rawJson: string): AppSettings {
  const parsed = parseSettings(JSON.parse(rawJson))
  saveSettings(parsed)
  return parsed
}
