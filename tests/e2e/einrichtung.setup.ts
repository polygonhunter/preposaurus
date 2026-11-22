// Läuft vor allen anderen Projekten (playwright.config.ts) gegen die leere E2E-Datenbank:
// Ersteinrichtung über die Oberfläche bis zur Übersicht (#34), danach die Sitzung speichern.
// Läuft lokal noch ein Server mit schon eingerichteter DB (reuseExistingServer), meldet sich der
// Test stattdessen an.
import { expect, test as setup, type Page } from '@playwright/test'
import { ADMIN_STORAGE_STATE, E2E_ADMIN, submitSignIn } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

async function setUpViaUi(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Willkommen' })).toBeVisible()
  await expectAccessibleLayout(page)

  // Der Benutzername folgt dem Anzeigenamen, bis er selbst geändert wird (ONBOARDING §2.2)
  const username = page.getByLabel('Benutzername')
  await page.getByLabel('Anzeigename').fill('Alex Beispiel')
  await expect(username).toHaveValue('alex')
  await page.getByLabel('Anzeigename').fill(E2E_ADMIN.displayName)
  await username.fill(E2E_ADMIN.username)

  const password = page.getByLabel('Passwort', { exact: true })
  await password.fill(`${E2E_ADMIN.username} mag Hafer`)
  await page.getByRole('button', { name: 'Weiter' }).click()

  // Fehler steht am Feld, der Fokus springt hin, die übrigen Eingaben bleiben
  await expect(password).toHaveAccessibleDescription(/Bitte ein Passwort ohne den Benutzernamen\.$/)
  await expect(password).toBeFocused()
  await expect(page.getByLabel('Anzeigename')).toHaveValue(E2E_ADMIN.displayName)
  await expect(username).toHaveValue(E2E_ADMIN.username)
  await expectAccessibleLayout(page)

  // „Anzeigen“ statt eines zweiten Passwortfelds
  const show = page.getByRole('button', { name: 'Anzeigen' })
  await expect(password).toHaveAttribute('type', 'password')
  await show.click()
  await expect(show).toHaveAttribute('aria-pressed', 'true')
  await expect(password).toHaveAttribute('type', 'text')

  await password.fill(E2E_ADMIN.password)
  await page.getByRole('button', { name: 'Weiter' }).click()
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
