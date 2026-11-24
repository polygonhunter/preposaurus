import { expect, test } from '../helpers/e2e-test'
import { E2E_ADMIN, signedOut, signInViaUi, submitSignIn } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Diese Tests brauchen eine eigene Sitzung, siehe tests/helpers/e2e-auth.ts.
test.use(signedOut)

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Anmeldeseite ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/anmelden')

    await expect(page.getByRole('heading', { level: 1, name: 'Anmelden' })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Angemeldet bleiben' })).toBeChecked()
    await expectAccessibleLayout(page)
  })
}

test('Direktaufruf einer geschützten Seite führt zur Anmeldung und danach dorthin zurück', async ({
  page,
}) => {
  await page.goto('/vorrat')

  await expect(page).toHaveURL(/\/anmelden\?weiter=%2Fvorrat$/)
  await submitSignIn(page)

  await expect(page).toHaveURL(/\/vorrat$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()
})

test('falsche Angaben ergeben einen neutralen Satz am Feld', async ({ page }, testInfo) => {
  // Je Projekt ein unbekannter Name: Die Bremse des Testadmins bleibt für parallele Tests frei,
  // und kein Name sammelt über die Projekte hinweg genug Fehlversuche für eine Sperre.
  const username = `niemand.${testInfo.project.name}`
  await page.goto('/anmelden')
  await submitSignIn(page, { username, password: 'falsches-passwort' })

  const password = page.getByLabel('Passwort', { exact: true })
  await expect(password).toHaveAccessibleDescription('Benutzername oder Passwort stimmt nicht.')
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Benutzername')).toHaveValue(username)
  await expect(page).toHaveURL(/\/anmelden/)
  await expectAccessibleLayout(page)
})

test('ein zu langer Name ergibt denselben neutralen Satz am Passwort', async ({ page }) => {
  // Über der Höchstlänge prüft das Schema, nicht die Anmeldung; verraten wird trotzdem nichts
  await page.goto('/anmelden')
  await submitSignIn(page, { username: 'n'.repeat(31), password: 'falsches-passwort' })

  const password = page.getByLabel('Passwort', { exact: true })
  await expect(password).toHaveAccessibleDescription('Benutzername oder Passwort stimmt nicht.')
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Benutzername')).not.toHaveAttribute('aria-invalid', 'true')
})

test('abmelden beendet die Sitzung, geschützte Seiten führen wieder zur Anmeldung', async ({
  page,
}) => {
  await signInViaUi(page)
  await page.goto('/einstellungen')
  // Der Wert steht je Stufe rechts oder unter dem Titel, sichtbar ist genau einer
  await expect(page.getByText(E2E_ADMIN.username).filter({ visible: true })).toBeVisible()

  await page.getByRole('button', { name: 'Abmelden' }).click()

  await expect(page).toHaveURL(/\/anmelden$/)
  await page.goto('/uebersicht')
  await expect(page).toHaveURL(/\/anmelden\?weiter=%2Fuebersicht$/)
})

test('nach der Einrichtung ist /einrichten nicht mehr erreichbar', async ({ page }) => {
  await page.goto('/einrichten')

  await expect(page).toHaveURL(/\/anmelden$/)
})

test('angemeldet führt /anmelden direkt in die App', async ({ page }) => {
  await signInViaUi(page)

  await page.goto('/anmelden?weiter=/statistik')

  await expect(page).toHaveURL(/\/statistik$/)
})
