import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'
import { E2E_ADMIN, signedOut, submitSignIn } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Nutzerverwaltung als Admin (#41, #123). Jedes Projekt legt seinen eigenen Nutzer an. Niemand
// außer dem Test-Admin wird Admin, damit der Test-Admin der letzte aktive Admin bleibt. Die
// Anmeldungen des neuen Nutzers laufen in einem eigenen Browser-Kontext.

const onlyOnDesktopAndIphone = (projectName: string) => {
  test.skip(!['desktop', 'iphone'].includes(projectName), 'Legt Nutzer an, läuft nur zweimal')
}

const usernameFor = (info: TestInfo) => `neu_${info.project.name.replaceAll('-', '_')}`

async function revealedPassword(page: Page): Promise<string> {
  const reveal = page.getByRole('region', { name: 'Dieses Passwort wird nur jetzt angezeigt.' })
  await expect(reveal).toBeVisible()
  return (await reveal.getByRole('definition').nth(1).innerText()).trim()
}

async function trySignIn(browser: Browser, info: TestInfo, password: string) {
  const context = await browser.newContext({
    ...signedOut,
    baseURL: info.project.use.baseURL ?? '',
  })
  const page = await context.newPage()
  await page.goto('/anmelden')
  await submitSignIn(page, { username: usernameFor(info), password })
  const isSignedIn = await page
    .waitForURL(/\/uebersicht$/, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false)
  await context.close()
  return isSignedIn
}

test('Nutzer anlegen, Passwort zurücksetzen, deaktivieren', async ({ page, browser }, info) => {
  onlyOnDesktopAndIphone(info.project.name)
  // Vier Anmeldungen in eigenen Browser-Kontexten brauchen mehr als die üblichen 30 s.
  test.slow()
  const username = usernameFor(info)
  await page.goto('/einstellungen/nutzer')
  await expectAccessibleLayout(page)
  await page.getByRole('link', { name: 'Hinzufügen' }).click()

  await page.getByLabel('Anzeigename').fill(`Neu ${info.project.name}`)
  await page.getByLabel('Benutzername').fill(E2E_ADMIN.username)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  const usernameField = page.getByLabel('Benutzername')
  await expect(usernameField).toHaveAccessibleDescription(/Diesen Benutzernamen gibt es schon/)
  await expectAccessibleLayout(page)

  await usernameField.fill(username)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  const firstPassword = await revealedPassword(page)
  await expectAccessibleLayout(page)
  expect(await trySignIn(browser, info, firstPassword)).toBe(true)

  await page.getByRole('link', { name: 'Weitergegeben' }).click()
  const row = page.getByRole('link', { name: new RegExp(`\\(${username}\\)`) })
  await expect(row).toContainText('Mitglied')
  await row.click()
  await expectAccessibleLayout(page)

  await page.getByRole('button', { name: 'Passwort zurücksetzen' }).click()
  const secondPassword = await revealedPassword(page)
  expect(secondPassword).not.toBe(firstPassword)
  expect(await trySignIn(browser, info, firstPassword)).toBe(false)
  expect(await trySignIn(browser, info, secondPassword)).toBe(true)

  await page.getByRole('button', { name: 'Deaktivieren' }).click()
  const sheet = page.getByRole('dialog', { name: /deaktivieren\?$/ })
  await sheet.getByRole('button', { name: 'Deaktivieren' }).click()
  await expect(page.getByRole('button', { name: 'Wieder aktivieren' })).toBeVisible()
  expect(await trySignIn(browser, info, secondPassword)).toBe(false)
})

test('das eigene Konto lässt sich weder deaktivieren noch als letzter Admin herabstufen', async ({
  page,
}) => {
  await page.goto('/einstellungen/nutzer')
  await page.getByRole('link', { name: new RegExp(`\\(${E2E_ADMIN.username}\\)`) }).click()
  await expect(page.getByRole('heading', { level: 1, name: E2E_ADMIN.displayName })).toBeVisible({
    timeout: 15_000,
  })

  await expect(page.getByText('Ihr braucht mindestens einen Admin.').first()).toBeVisible()
  await expect(page.getByText('Dein eigenes Konto deaktiviert ein anderer Admin.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deaktivieren' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Rolle speichern' })).toHaveCount(0)
  await expectAccessibleLayout(page)
})
