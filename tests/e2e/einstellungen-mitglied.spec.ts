import { expect, test } from '@playwright/test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Einstellungen als Mitglied (#37, #38, #39): Haushalt nur lesend, Nutzerverwaltung und Daten &
// System gar nicht, auch nicht per Direktaufruf. Eigene Sitzung, damit die des Admins bleibt.
test.use(signedOut)

test.beforeEach(async ({ page }) => {
  await signInViaUi(page, E2E_MEMBER)
})

test('sieht den Haushalt nur lesend und keine Admin-Bereiche', async ({ page }) => {
  await page.goto('/einstellungen')

  await expect(page.getByRole('heading', { level: 2, name: 'Haushalt' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Nutzerverwaltung' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Daten & System' })).toHaveCount(0)
  await expect(page.getByText('Ansehen kannst du alles, ändern kann es ein Admin.')).toBeVisible()
  await expectAccessibleLayout(page)

  await page.getByRole('link', { name: /Mitglieder und Ernährung/ }).click()
  await expect(page.getByRole('list', { name: 'Personen' })).toContainText('Kim')
  await expect(page.getByRole('link', { name: /Kim/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Hinzufügen' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Speichern' })).toHaveCount(0)
  await expectAccessibleLayout(page)

  await page.goto('/einstellungen/ziel')
  await expect(page.getByText('Zieldauer', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Speichern' })).toHaveCount(0)
  await expect(page.getByText('Das ändert ein Admin.')).toBeVisible()
  await expectAccessibleLayout(page)

  await page.goto('/einstellungen/regeln')
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByText('Das ändert ein Admin.')).toBeVisible()
})

test('Admin-Seiten antworten auch per Direktaufruf mit „nicht gefunden“', async ({ page }) => {
  for (const path of [
    '/einstellungen/nutzer',
    '/einstellungen/system',
    '/einstellungen/mitglieder/neu',
  ]) {
    const response = await page.goto(path)

    expect(response?.status(), path).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Nicht gefunden' })).toBeVisible()
  }
  await expectAccessibleLayout(page)
})
