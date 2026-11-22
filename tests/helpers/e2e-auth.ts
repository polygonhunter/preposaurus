// Anmeldung für die E2E-Tests (#33). Das Projekt „einrichtung“ richtet die leere E2E-Datenbank
// einmal über die Oberfläche ein und speichert die Sitzung des Admins in ADMIN_STORAGE_STATE.
// Alle anderen Projekte starten damit schon angemeldet (playwright.config.ts).
// Tests, die selbst anmelden oder abmelden, nutzen eine eigene Sitzung (signedOut + signInViaUi),
// sonst beendet ein Abmelden die gemeinsame Sitzung aller parallelen Tests.
import { expect, type Page } from '@playwright/test'

/** Erfundener Testnutzer, nur für die Wegwerf-Datenbank der E2E-Tests */
export const E2E_ADMIN = {
  displayName: 'Test Admin',
  username: 'testadmin',
  password: 'Hafer Linse Regal Wolke',
} as const

export const ADMIN_STORAGE_STATE = '.data/e2e-auth/admin.json'

/** Für test.use(): ohne gespeicherte Sitzung starten */
export const signedOut = { storageState: { cookies: [], origins: [] } }

type Credentials = Readonly<{ username: string; password: string }>

/** Füllt die Anmeldeseite aus, die schon offen ist, und schickt sie ab. */
export async function submitSignIn(page: Page, credentials: Credentials = E2E_ADMIN) {
  await page.getByLabel('Benutzername').fill(credentials.username)
  await page.getByLabel('Passwort', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Anmelden' }).click()
}

/** Meldet über die Oberfläche an und wartet, bis die App-Seite da ist. */
export async function signInViaUi(page: Page, credentials: Credentials = E2E_ADMIN) {
  await page.goto('/anmelden')
  await submitSignIn(page, credentials)
  await expect(page).toHaveURL(/\/uebersicht$/)
}
