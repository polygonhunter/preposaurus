import type { Browser, Page, TestInfo } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { signedOut, submitSignIn } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Mein Konto (#75, #89). Der Admin legt je Projekt einen eigenen Nutzer an, damit das Ändern des
// Passworts keine Sitzung anderer Tests beendet. Passwörter sind erfunden.
const FIRST_PASSWORD = 'Kerze Linse Regal Wolke'
const NEW_PASSWORD = 'Hafer Dose Wasser Radio'

const onlyOnDesktopAndIphone = (projectName: string) => {
  test.skip(!['desktop', 'iphone'].includes(projectName), 'Legt Nutzer an, läuft nur zweimal')
}

const usernameFor = (info: TestInfo) => `konto_${info.project.name.replaceAll('-', '_')}`

async function createUser(page: Page, info: TestInfo) {
  await page.goto('/einstellungen/nutzer/neu')
  await page.getByLabel('Anzeigename').fill(`Konto ${info.project.name}`)
  await page.getByLabel('Benutzername').fill(usernameFor(info))
  // Häufige Passwörter lehnt die Sperrliste ab, ruhig am Feld (#174)
  const password = page.getByLabel('Passwort (freiwillig)')
  await password.fill('Passwort123!')
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(password).toHaveAccessibleDescription(/sehr verbreitet/)
  await password.fill(FIRST_PASSWORD)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(
    page.getByRole('region', { name: 'Dieses Passwort wird nur jetzt angezeigt.' }),
  ).toBeVisible()
}

async function signInAsNewUser(browser: Browser, info: TestInfo, password: string) {
  const context = await browser.newContext({
    ...signedOut,
    baseURL: info.project.use.baseURL ?? '',
  })
  const page = await context.newPage()
  await page.goto('/anmelden')
  await submitSignIn(page, { username: usernameFor(info), password })
  const isSignedIn = await page
    .waitForURL(/\/uebersicht$/, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false)
  return { page, context, isSignedIn }
}

test('Profil, Adresse für Erinnerungen und Passwort ändern', async ({ page, browser }, info) => {
  onlyOnDesktopAndIphone(info.project.name)
  test.slow()
  await createUser(page, info)
  const { page: own, context, isSignedIn } = await signInAsNewUser(browser, info, FIRST_PASSWORD)
  expect(isSignedIn).toBe(true)

  await own.goto('/einstellungen')
  await own.getByRole('link', { name: /Profil, Passwort und Mails/ }).click()
  await expect(own.getByRole('heading', { level: 1, name: 'Mein Konto' })).toBeVisible()
  await expect(
    own.getByRole('list', { name: 'Anmeldung' }).getByText(usernameFor(info), { exact: true }),
  ).toBeVisible()
  await expect(own.getByText(/Magst du ein eigenes Passwort setzen\?/)).toBeVisible()
  await expectAccessibleLayout(own)

  const email = own.getByLabel('E-Mail für Erinnerungen (freiwillig)')
  await email.fill('kein-at')
  await own.getByRole('button', { name: 'Speichern' }).first().click()
  await expect(email).toHaveAccessibleDescription(/name@beispiel\.de/)
  await own.getByLabel('Anzeigename').fill(`Konto neu ${info.project.name}`)
  await email.fill('konto@example.org')
  await own.getByRole('button', { name: 'Speichern' }).first().click()
  await expect(own.getByText('Gespeichert.', { exact: true })).toBeVisible()
  await own.reload()
  await expect(email).toHaveValue('konto@example.org')
  await expect(own.getByLabel('Anzeigename')).toHaveValue(`Konto neu ${info.project.name}`)
  // Ohne SMTP in der E2E-Umgebung ist die Check-in-Mail nicht wählbar, mit ruhiger Erklärung
  await expect(
    own.getByText('Auf diesem Server ist kein Mailversand eingerichtet.', { exact: false }),
  ).toBeVisible()

  const current = own.getByLabel('Bisheriges Passwort')
  await current.fill('ganz-falsch-123')
  await own.getByLabel('Neues Passwort').fill(NEW_PASSWORD)
  await own.getByRole('button', { name: 'Passwort ändern' }).click()
  await expect(current).toHaveAccessibleDescription('Das bisherige Passwort stimmt nicht.')
  // Der Knopf blendet nach dem Laden wieder ein, axe misst sonst den halb durchsichtigen Zustand
  await expect(own.getByRole('button', { name: 'Passwort ändern' })).toHaveCSS('opacity', '1')
  await expectAccessibleLayout(own)

  await current.fill(FIRST_PASSWORD)
  await own.getByLabel('Neues Passwort').fill(NEW_PASSWORD)
  await own.getByRole('button', { name: 'Passwort ändern' }).click()
  await expect(own.getByText(/Dein Passwort ist geändert\./)).toBeVisible()
  await expect(own.getByText(/Zuletzt geändert am .*, von Konto neu/)).toBeVisible()
  // Dieses Gerät bleibt angemeldet
  await own.reload()
  await expect(own.getByRole('heading', { level: 1, name: 'Mein Konto' })).toBeVisible()
  await context.close()

  expect((await signInAsNewUser(browser, info, FIRST_PASSWORD)).isSignedIn).toBe(false)
  const again = await signInAsNewUser(browser, info, NEW_PASSWORD)
  expect(again.isSignedIn).toBe(true)
  await again.context.close()
})
