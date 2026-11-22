// Läuft vor allen anderen Projekten (playwright.config.ts) gegen die leere E2E-Datenbank:
// Ersteinrichtung über die Oberfläche bis zur Übersicht (#34), danach die Sitzung speichern.
// Läuft lokal noch ein Server mit schon eingerichteter DB (reuseExistingServer), meldet sich der
// Test stattdessen an.
import { expect, test as setup, type Page } from '@playwright/test'
import { ADMIN_STORAGE_STATE, E2E_ADMIN, submitSignIn } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

async function setUpViaUi(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Willkommen' })).toBeVisible()
  await expect(page.getByLabel('Name des Haushalts')).toHaveValue('Unser Haushalt')
  await expectAccessibleLayout(page)

  await page.getByLabel('Benutzername').fill(E2E_ADMIN.username)
  await page.getByLabel('Passwort', { exact: true }).fill(E2E_ADMIN.password)
  await page.getByLabel('Passwort wiederholen').fill('etwas anderes als oben')
  await page.getByLabel('Name des Haushalts').fill(E2E_ADMIN.householdName)
  await page.getByRole('button', { name: 'Einrichten' }).click()

  // Fehler steht am Feld, die übrigen Eingaben bleiben
  const repeat = page.getByLabel('Passwort wiederholen')
  await expect(repeat).toHaveAccessibleDescription('Die beiden Passwörter sind nicht gleich.')
  await expect(page.getByLabel('Benutzername')).toHaveValue(E2E_ADMIN.username)
  await expectAccessibleLayout(page)

  await page.getByLabel('Passwort', { exact: true }).fill(E2E_ADMIN.password)
  await repeat.fill(E2E_ADMIN.password)
  await page.getByRole('button', { name: 'Einrichten' }).click()
}

setup('Ersteinrichtung bis zur Übersicht', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(einrichten|anmelden)/)

  if (page.url().includes('/einrichten')) {
    await setUpViaUi(page)
  } else {
    await submitSignIn(page)
  }

  await expect(page).toHaveURL(/\/uebersicht$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
