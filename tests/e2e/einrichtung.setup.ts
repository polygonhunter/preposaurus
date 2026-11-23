// Läuft vor allen anderen Projekten (playwright.config.ts) gegen die leere E2E-Datenbank:
// kompletter erster Start über die Oberfläche (#34, #40): Konto, Mitglieder (einmal übersprungen,
// dann „Alex“ eingetragen), Wiedereinstieg nach dem Abmelden beim offenen Schritt, Ziel, Übersicht.
// Danach die Sitzung speichern. „Alex“ gehört auch zum Beispielvorrat, der ihn nicht doppelt anlegt,
// und das Ziel bleibt beim Standard (10 Tage, kein Datum). So laufen alle anderen Tests unverändert.
// Läuft lokal noch ein Server mit schon eingerichteter DB (reuseExistingServer), meldet sich der
// Test stattdessen an.
import { expect, test as setup, type Page } from '@playwright/test'
import { ADMIN_STORAGE_STATE, E2E_ADMIN, submitSignIn } from '../helpers/e2e-auth'
import { expectSetupStep } from '../helpers/setup-steps'
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

// Schritt „Mitglieder“: erst überspringen und zurückblättern, dann eine Person mit demselben
// Formular wie in den Einstellungen eintragen.
async function membersStep(page: Page) {
  await expectSetupStep(page, { path: '/einrichten/mitglieder', title: 'Für wen plant ihr?' })
  await expect(page.getByText(/^Noch ist niemand eingetragen\./)).toBeVisible()
  await page.getByRole('button', { name: 'Überspringen' }).click()
  await expectSetupStep(page, { path: '/einrichten/ziel', title: 'Euer Ziel', step: 3 })
  await page.getByRole('link', { name: 'Zurück' }).click()

  await expectSetupStep(page, { path: '/einrichten/mitglieder', title: 'Für wen plant ihr?' })
  await page.getByRole('link', { name: 'Person hinzufügen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Person hinzufügen' })).toBeVisible()
  await page.getByLabel('Name').fill('Alex')
  await page.getByText('Erwachsene:r', { exact: true }).click()
  await page.getByLabel('Geburtsjahr').fill('1984')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expectSetupStep(page, { path: '/einrichten/mitglieder', title: 'Für wen plant ihr?' })
  await expect(page.getByText('Alex', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expectSetupStep(page, { path: '/einrichten/ziel', title: 'Euer Ziel', step: 3 })
}

// Wer abbricht und sich später anmeldet, landet beim offenen Schritt (ONBOARDING §2.3).
async function resumeAfterSignOut(page: Page) {
  await page.context().clearCookies()
  await page.goto('/uebersicht')
  await expect(page).toHaveURL(/\/anmelden/)
  await submitSignIn(page)
  await expectSetupStep(page, { path: '/einrichten/ziel', title: 'Euer Ziel', step: 3 })
}

// Schritt „Ziel“ mit der Quelle samt Hinweis wie auf der Zielseite. Ein vergangenes Datum lehnt
// das Formular ab, „Weiter“ speichert den Standard und schließt die Einrichtung am PC ab.
async function goalStep(page: Page) {
  await expect(page.getByText('Werte noch nicht geprüft')).toBeVisible()
  await expect(page.getByText('Rechenmodus')).toBeVisible()
  const date = page.getByLabel('Bis wann? (freiwillig)')
  await date.fill('2020-01-31')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(date).toHaveAccessibleDescription(/Dieses Datum ist schon vorbei\./)
  await expect(page).toHaveURL(/\/einrichten\/ziel$/)

  await date.fill('')
  await page.getByText('10 Tage', { exact: true }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
}

// Übersicht nach der Einrichtung: ohne Vorrat, mit Person und Ziel in Tagen (#67, UX-Konzept §7).
async function expectEmptyOverview(page: Page) {
  await expect(page.getByText(/^Noch nichts im Vorrat\./)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Erstes Produkt erfassen' })).toHaveAttribute(
    'href',
    '/neu',
  )
  await expect(page.getByRole('region', { name: 'Bald fällig' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^1 Person · Ziel 10 Tage/ })).toHaveAttribute(
    'href',
    '/einstellungen',
  )
  // Die Einrichtung setzt die Quelle BBK/BLE aus dem Seed, noch ungeprüft (#20)
  await expect(page.getByText(/^BBK\/BLE, Stand .* · Werte noch nicht geprüft$/)).toBeVisible()
  for (const colorScheme of ['light', 'dark'] as const) {
    // Neu laden statt umschalten: Farbübergänge würden axe sonst mitten im Wechsel treffen
    await page.emulateMedia({ colorScheme })
    await page.reload()
    await expect(page.getByRole('link', { name: 'Erstes Produkt erfassen' })).toBeVisible()
    await expectAccessibleLayout(page)
  }
  await page.emulateMedia({ colorScheme: null })
}

setup('erster Start bis zur Übersicht', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(einrichten|anmelden)/)

  const isFreshInstall = page.url().includes('/einrichten')
  if (isFreshInstall) {
    await setUpViaUi(page)
    await membersStep(page)
    await resumeAfterSignOut(page)
    await goalStep(page)
  } else {
    await submitSignIn(page)
  }

  await expect(page).toHaveURL(/\/uebersicht$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
  // Nur direkt nach der Einrichtung ist der Haushalt leer, danach legt „beispielvorrat“ Vorrat an
  if (isFreshInstall) await expectEmptyOverview(page)
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
