import { openDB } from 'idb'

import type { PracticeSession, SessionScorePoint } from '../types/domain'

const DATABASE_NAME = 'syntactic-practice-db'
const DATABASE_VERSION = 1
const SESSION_STORE = 'sessions'

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(SESSION_STORE)) {
      const store = db.createObjectStore(SESSION_STORE, {
        keyPath: 'id',
      })
      store.createIndex('updatedAt', 'updatedAt')
    }
  },
})

export async function saveSession(session: PracticeSession): Promise<void> {
  const db = await dbPromise
  await db.put(SESSION_STORE, session)
}

export async function getSessionById(
  sessionId: string,
): Promise<PracticeSession | undefined> {
  const db = await dbPromise
  return db.get(SESSION_STORE, sessionId)
}

export async function listSessions(): Promise<PracticeSession[]> {
  const db = await dbPromise
  const all = await db.getAll(SESSION_STORE)

  return all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function extractScorePoints(session: PracticeSession): SessionScorePoint[] {
  return session.turns
    .filter((turn) => turn.role === 'user' && turn.analysis)
    .map((turn) => ({
      turnId: turn.id,
      at: turn.createdAt,
      score: turn.analysis!.score,
    }))
}

export function getSessionAverageScore(session: PracticeSession): number {
  const points = extractScorePoints(session)
  if (points.length === 0) {
    return 0
  }

  const total = points.reduce((acc, point) => acc + point.score, 0)
  return Number((total / points.length).toFixed(2))
}
