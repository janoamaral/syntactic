import { expect, test, type Page } from '@playwright/test'
import type { PracticeSession } from '../src/types/domain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed a session directly into the browser's IndexedDB. */
async function seedSession(page: Page, session: PracticeSession): Promise<void> {
  await page.evaluate(async (s: PracticeSession) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('syntactic-practice-db', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' })
        }
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('sessions', 'readwrite')
        tx.objectStore('sessions').put(s)
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, session)
}

function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'e2e-session-1',
    createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-15T10:10:00Z').toISOString(),
    topic: 'E2E Test Topic',
    culture: 'American English (US)',
    provider: 'ollama',
    model: 'llama3.1:8b',
    turns: [
      {
        id: 'a1',
        role: 'assistant',
        content: 'Hello, what would you like to talk about?',
        createdAt: new Date('2026-01-15T10:00:01Z').toISOString(),
      },
      {
        id: 'u1',
        role: 'user',
        content: 'I want to practice writing about software.',
        createdAt: new Date('2026-01-15T10:00:30Z').toISOString(),
        analysis: {
          grammarErrors: [],
          syntaxErrors: [],
          naturalnessNotes: [],
          improvementTips: ['Try using more specific vocabulary.'],
          score: 7,
          scoreRationale: 'Clear but could be more specific.',
        },
      },
    ],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Sessions view – empty state', () => {
  test('shows empty state message when no sessions exist', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sessions' }).click()
    await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible()
    await expect(page.getByText('No sessions yet')).toBeVisible()
  })
})

test.describe('Sessions view – with seeded sessions', () => {
  test('shows session card after seeding a session', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    // Reload the sessions list by navigating away and back
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()
    await expect(page.getByText('E2E Test Topic')).toBeVisible()
  })

  test('shows resume and delete buttons for each session card', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()
    await expect(page.getByRole('button', { name: '▶ Resume' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '🗑 Delete' }).first()).toBeVisible()
  })
})

test.describe('Resume session', () => {
  test('navigates to practice view and shows session conversation when resumed from card', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    await page.getByRole('button', { name: '▶ Resume' }).first().click()

    // Should now be in the practice view with the session active
    await expect(page.getByText('E2E Test Topic')).toBeVisible()
    await expect(page.getByText('I want to practice writing about software.')).toBeVisible()
    await expect(page.getByRole('button', { name: /End session/i })).toBeVisible()
  })

  test('navigates to practice view when resumed from session detail', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    // Open detail
    await page.getByText('E2E Test Topic').click()
    await expect(page.getByRole('button', { name: '▶ Resume' })).toBeVisible()
    await page.getByRole('button', { name: '▶ Resume' }).click()

    await expect(page.getByText('E2E Test Topic')).toBeVisible()
    await expect(page.getByRole('button', { name: /End session/i })).toBeVisible()
  })
})

test.describe('Delete session', () => {
  test('removes session from list after confirming deletion', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    // Handle the browser confirm dialog
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: '🗑 Delete' }).first().click()

    await expect(page.getByText('No sessions yet')).toBeVisible()
    await expect(page.getByText('E2E Test Topic')).not.toBeVisible()
  })

  test('cancelling deletion leaves the session intact', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    // Dismiss the confirm dialog
    page.on('dialog', (dialog) => dialog.dismiss())
    await page.getByRole('button', { name: '🗑 Delete' }).first().click()

    await expect(page.getByText('E2E Test Topic')).toBeVisible()
  })

  test('deletes session from detail view and returns to sessions list', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession())
    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    await page.getByText('E2E Test Topic').click()
    await expect(page.getByRole('button', { name: '🗑 Delete' })).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: '🗑 Delete' }).click()

    // Should return to sessions list showing empty state
    await expect(page.getByText('No sessions yet')).toBeVisible()
  })

  test('deletes one of multiple sessions without affecting others', async ({ page }) => {
    await page.goto('/')
    await seedSession(page, makeSession({ id: 'e2e-session-keep', topic: 'Keep Me' }))
    await seedSession(page, makeSession({ id: 'e2e-session-del', topic: 'Delete Me', updatedAt: '2026-01-16T10:00:00Z' }))

    await page.getByRole('button', { name: 'Sessions' }).click()
    await page.getByRole('button', { name: 'Progress' }).click()
    await page.getByRole('button', { name: 'Sessions' }).click()

    // The "Delete Me" session will be first (newer updatedAt)
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: '🗑 Delete' }).first().click()

    await expect(page.getByText('Delete Me')).not.toBeVisible()
    await expect(page.getByText('Keep Me')).toBeVisible()
  })
})
