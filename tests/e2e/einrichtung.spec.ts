// Folgeschritte der Einrichtung nach dem Abschluss (#40). Den ersten Start selbst samt Überspringen
// und Wiedereinstieg prüft das Projekt „einrichtung“ (einrichtung.setup.ts) gegen die leere DB.
import { expect, test } from '../helpers/e2e-test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'

const STEP_PATHS = [
  '/einrichten/mitglieder',
  '/einrichten/mitglieder/neu',
  '/einrichten/ziel',
  '/einrichten/foto-erkennung',
  '/einrichten/home-bildschirm',
]

test('nach dem Abschluss führen die Schritte zur Übersicht', async ({ page }) => {
  for (const path of STEP_PATHS) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/uebersicht$/)
  }
})

test.describe('mit eigener Sitzung', () => {
  test.use(signedOut)

  test('ohne Anmeldung geht es zur Anmeldung', async ({ page }) => {
    await page.goto('/einrichten/mitglieder')
    await expect(page).toHaveURL(/\/anmelden$/)
  })

  test('ein Mitglied sieht keine Schritte der Einrichtung', async ({ page }) => {
    await signInViaUi(page, E2E_MEMBER)
    await page.goto('/einrichten/ziel')
    await expect(page).toHaveURL(/\/uebersicht$/)
  })
})
