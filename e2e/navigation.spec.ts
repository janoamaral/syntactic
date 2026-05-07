import { expect, test } from '@playwright/test'

test('navigates across main views and updates settings form', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('SYNTACTIC')).toBeVisible()

  await page.getByRole('button', { name: 'Sessions' }).click()
  await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible()

  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  const modelInput = page.getByLabel('Model name')
  await modelInput.fill('llama3.3:latest')
  await page.getByRole('button', { name: 'Save settings' }).click()

  await expect(page.getByText('Saved')).toBeVisible()

  await page.getByRole('button', { name: 'NEW' }).click()
  await expect(page.getByRole('button', { name: 'Start practice' })).toBeVisible()
})
