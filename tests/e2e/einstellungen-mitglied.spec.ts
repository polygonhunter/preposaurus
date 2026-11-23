import { expect, test } from '../helpers/e2e-test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Einstellungen als Mitglied (#37, #38, #39): Haushalt nur lesend, Nutzerverwaltung gar nicht, auch
// nicht per Direktaufruf. Lizenz und Quellen sieht jede Person (AGPL, #217). Eigene Sitzung, damit
// die des Admins bleibt.
test.use(signedOut)

test.beforeEach(async ({ page }) => {
  await signInViaUi(page, E2E_MEMBER)
})

test('sieht den Haushalt nur lesend und keine Nutzerverwaltung', async ({ page }) => {
  await page.goto('/einstellungen')

  await expect(page.getByRole('heading', { level: 2, name: 'Haushalt' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Nutzerverwaltung' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Daten & System' })).toBeVisible()
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
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('list', { name: 'Ampel' })).toContainText('ab 28 Tage')
  await expect(page.getByText('Das ändert ein Admin.')).toBeVisible()
  await expectAccessibleLayout(page)
})

test('sieht die Lagerorte nur lesend (#77)', async ({ page }) => {
  await page.goto('/einstellungen')
  await page.getByRole('link', { name: /Lagerorte/ }).click()

  await expect(page.getByRole('list', { name: 'Zur Wahl beim Erfassen' })).toContainText('Keller')
  await expect(page.getByRole('link', { name: /Keller/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /nach oben|Hinzufügen/ })).toHaveCount(0)
  await expect(page.getByText(/Das ändert ein Admin\./)).toBeVisible()
  await expectAccessibleLayout(page)
})

test('sieht Lizenz und Quelltext (AGPL, #217)', async ({ page }) => {
  await page.goto('/einstellungen')
  await page.getByRole('link', { name: /Lizenz und Quellen/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Daten & System' })).toBeVisible()
  await expect(page.getByText('AGPL-3.0-or-later')).toBeVisible()
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible()
  await expectAccessibleLayout(page)
})

test('Admin-Seiten antworten auch per Direktaufruf mit „nicht gefunden“', async ({ page }) => {
  for (const path of [
    '/einstellungen/nutzer',
    '/einstellungen/nutzer/neu',
    '/einstellungen/mitglieder/neu',
    // Bearbeiten eines Lagerorts gibt es nur für den Admin, die ID spielt keine Rolle
    '/einstellungen/lagerorte/00000000-0000-4000-8000-000000000000',
  ]) {
    const response = await page.goto(path)

    expect(response?.status(), path).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Nicht gefunden' })).toBeVisible()
  }
  await expectAccessibleLayout(page)
})
