import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSession } from '../types/domain'

// ---------------------------------------------------------------------------
// In-memory mock for idb – hoisted so the mock factory can reference mockDb
// ---------------------------------------------------------------------------
const { mockDb, store } = vi.hoisted(() => {
  const store = new Map<string, PracticeSession>()
  const mockDb = {
    put: vi.fn(async (_storeName: string, item: PracticeSession) => {
      store.set(item.id, item)
    }),
    get: vi.fn(async (_storeName: string, key: string) => store.get(key)),
    getAll: vi.fn(async () => Array.from(store.values())),
    delete: vi.fn(async (_storeName: string, key: string) => {
      store.delete(key)
    }),
  }
  return { mockDb, store }
})

vi.mock('idb', () => ({
  openDB: vi.fn(async () => mockDb),
}))

import {
  saveSession,
  getSessionById,
  listSessions,
  deleteSession,
} from './sessionDb'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:05:00.000Z',
    topic: 'Casual conversation',
    culture: 'American English (US)',
    provider: 'ollama',
    model: 'llama3.1:8b',
    turns: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('saveSession', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('calls db.put with the session store name and session object', async () => {
    const session = makeSession()
    await saveSession(session)
    expect(mockDb.put).toHaveBeenCalledWith('sessions', session)
  })

  it('persists the session so it can be retrieved', async () => {
    const session = makeSession()
    await saveSession(session)
    const retrieved = await getSessionById(session.id)
    expect(retrieved).toEqual(session)
  })
})

describe('getSessionById', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('returns undefined for an unknown id', async () => {
    expect(await getSessionById('non-existent')).toBeUndefined()
  })

  it('returns the matching session', async () => {
    const session = makeSession({ id: 'abc' })
    await saveSession(session)
    expect(await getSessionById('abc')).toEqual(session)
  })
})

describe('listSessions', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('returns an empty array when there are no sessions', async () => {
    expect(await listSessions()).toEqual([])
  })

  it('sorts sessions by updatedAt descending', async () => {
    const older = makeSession({ id: 's1', updatedAt: '2026-01-01T10:00:00.000Z' })
    const newer = makeSession({ id: 's2', updatedAt: '2026-01-02T10:00:00.000Z' })
    await saveSession(older)
    await saveSession(newer)
    const result = await listSessions()
    expect(result[0].id).toBe('s2')
    expect(result[1].id).toBe('s1')
  })
})

describe('deleteSession', () => {
  beforeEach(() => {
    store.clear()
    vi.clearAllMocks()
  })

  it('calls db.delete with the session store name and session id', async () => {
    const session = makeSession({ id: 'del-1' })
    await saveSession(session)
    await deleteSession('del-1')
    expect(mockDb.delete).toHaveBeenCalledWith('sessions', 'del-1')
  })

  it('removes the session from the store', async () => {
    const session = makeSession({ id: 'del-2' })
    await saveSession(session)
    await deleteSession('del-2')
    expect(await getSessionById('del-2')).toBeUndefined()
  })

  it('does not throw when deleting a non-existent id', async () => {
    await expect(deleteSession('ghost')).resolves.toBeUndefined()
  })

  it('only removes the targeted session and leaves others intact', async () => {
    const a = makeSession({ id: 'keep' })
    const b = makeSession({ id: 'remove' })
    await saveSession(a)
    await saveSession(b)
    await deleteSession('remove')
    const remaining = await listSessions()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('keep')
  })
})
