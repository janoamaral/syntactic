import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from '../types/domain'
import { parseSettings, tryExtractJson } from './schema'

describe('parseSettings', () => {
  it('accepts a valid settings payload', () => {
    const parsed = parseSettings({ ...DEFAULT_SETTINGS })

    expect(parsed).toEqual(DEFAULT_SETTINGS)
  })

  it('throws for invalid payloads', () => {
    expect(() => parseSettings({ model: 'llama3.1:8b' })).toThrow(
      'Invalid settings payload.',
    )
  })
})

describe('tryExtractJson', () => {
  it('extracts embedded JSON object from model text', () => {
    const raw = 'Result: {"ok":true,"score":8}'

    expect(tryExtractJson(raw)).toEqual({ ok: true, score: 8 })
  })

  it('throws when no JSON object is present', () => {
    expect(() => tryExtractJson('No JSON here')).toThrow(
      'Model did not return valid JSON.',
    )
  })
})
