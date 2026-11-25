// Läuft vor allen anderen Projekten (playwright.config.ts) gegen die leere E2E-Datenbank:
// kompletter erster Start über die Oberfläche (#34, #40): Konto, Mitglieder (einmal übersprungen,
// dann „Alex“ eingetragen), Wiedereinstieg nach dem Abmelden beim offenen Schritt, Ziel,
// Foto-Erkennung (#314) übersprungen, Übersicht. Danach die Sitzung speichern. „Alex“ gehört auch
// zum Beispielvorrat, der ihn nicht doppelt anlegt, und das Ziel bleibt beim Standard (10 Tage, kein
// Datum). So laufen alle anderen Tests unverändert.
// Läuft lokal noch ein Server mit schon eingerichteter DB (reuseExistingServer), meldet sich der
// Test stattdessen an.
import type { Page } from '@playwright/test'
import { expect, test as setup } from '../helpers/e2e-test'
import { ADMIN_STORAGE_STATE, E2E_ADMIN, submitSignIn } from '../helpers/e2e-auth'
import { expectRequiredFieldError } from '../helpers/field-errors'
import { waitForHydration } from '../helpers/hydration'
import { expectSetupStep } from '../helpers/setup-steps'
import { expectAccessibleLayout } from '../helpers/page-checks'

async function setUpViaUi(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Willkommen' })).toBeVisible()
  await expectAccessibleLayout(page)

  // Leer abgeschickt: Fehler am Feld statt der Sprechblase des Browsers (#286)
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expectRequiredFieldError(page.getByLabel('Anzeigename'), 'Bitte einen Namen eintragen.')
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

// Schritt „Ziel“ mit der geprüften Quelle wie auf der Zielseite (ohne Hinweis, U3). Ein vergangenes
// Datum lehnt das Formular ab, „Weiter“ speichert den Standard und führt zur Foto-Erkennung.
async function goalStep(page: Page) {
  await expect(page.getByText('BBK/BLE', { exact: true })).toBeVisible()
  await expect(page.getByText('Werte noch nicht geprüft')).toHaveCount(0)
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

// Schritt „Foto-Erkennung“ (#314): Der E2E-Server hat AI_PROVIDER=fake, also eine Verbindung aus der
// Umgebung. Der Schritt nennt sie nur, ohne Schlüsselfeld, und „Weiter“ schaltet nichts ein, denn
// die Foto-Erfassung verlässt sich auf eine ausgeschaltete Erkennung. Hell und dunkel mit axe,
// danach schließt „Weiter“ die Einrichtung am PC ab.
async function recognitionStep(page: Page) {
  const step = { path: '/einrichten/foto-erkennung', title: 'Foto-Erkennung einrichten', step: 4 }
  await expectSetupStep(page, step)
  await expect(page.getByText('Fotos gehen an Anthropic')).toBeVisible()
  await expect(page.getByText('Test-Anbieter ohne Netz', { exact: true })).toBeVisible()
  await expect(page.getByText(/AI_PROVIDER=fake/)).toBeVisible()
  await expect(page.getByLabel('API-Schlüssel von Anthropic')).toHaveCount(0)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await page.reload()
    await expectSetupStep(page, step)
  }
  await page.emulateMedia({ colorScheme: null })
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
  // Die Einrichtung setzt die geprüfte Quelle BBK/BLE aus dem Seed (#20, U3)
  await expect(page.getByText(/^BBK\/BLE, Stand [^·]*$/)).toBeVisible()
  for (const colorScheme of ['light', 'dark'] as const) {
    // Neu laden statt umschalten: Farbübergänge würden axe sonst mitten im Wechsel treffen
    await page.emulateMedia({ colorScheme })
    await page.reload()
    await expect(page.getByRole('link', { name: 'Erstes Produkt erfassen' })).toBeVisible()
    await expectAccessibleLayout(page)
  }
  await page.emulateMedia({ colorScheme: null })
}

// Brach ein Versuch mitten in der Einrichtung ab (Retry in der CI, #263), führt die Anmeldung zum
// offenen Schritt statt zur Übersicht. Mit den Standardwerten weiter, bis die Übersicht kommt.
async function finishOpenSetup(page: Page, remainingSteps = 4): Promise<void> {
  await expect(page).toHaveURL(/\/(uebersicht|einrichten\/[a-z-]+)$/)
  const openStep = page.url()
  if (!openStep.includes('/einrichten/') || remainingSteps === 0) return
  await page
    .getByRole('button', { name: /^(Weiter|Überspringen|Später in den Einstellungen)$/ })
    .first()
    .click()
  await expect(page).not.toHaveURL(openStep)
  await finishOpenSetup(page, remainingSteps - 1)
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
    await recognitionStep(page)
  } else {
    await submitSignIn(page)
    await finishOpenSetup(page)
  }

  await expect(page).toHaveURL(/\/uebersicht$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
  // Nur direkt nach der Einrichtung ist der Haushalt leer, danach legt „beispielvorrat“ Vorrat an
  if (isFreshInstall) await expectEmptyOverview(page)
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
