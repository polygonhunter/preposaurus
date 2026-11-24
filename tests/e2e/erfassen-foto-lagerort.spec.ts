// „+ Neuer Lagerort“ im Foto-Weg (#301): Im Schritt Prüfen legt das Blatt den Ort an und wählt
// ihn, wie im manuellen Weg (erfassen-neuer-lagerort.spec.ts). Läuft im Projekt „foto“ mit einem
// Worker, weil alle Foto-Tests denselben Entwurf des Admins nutzen.
import { attemptOf } from '../helpers/attempt'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'
import { shoot, startFresh } from '../helpers/photo-capture'

test('„+ Neuer Lagerort“ im Prüfen legt an und wählt den Ort (#301)', async ({
  page,
}, testInfo) => {
  const name = `Testregal Foto ${String(attemptOf(testInfo))}`
  await startFresh(page)
  await shoot(page, '#579')
  await page.getByRole('button', { name: 'Kamera schließen' }).click()

  await page.getByRole('button', { name: '+ Neuer Lagerort' }).click()
  const sheet = page.getByRole('dialog', { name: 'Neuer Lagerort' })
  await sheet.getByLabel('Name des Lagerorts').fill(name)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
  await sheet.getByRole('button', { name: 'Anlegen' }).click()

  await expect(sheet).toBeHidden()
  await expect(
    page.getByRole('group', { name: 'Lagerort' }).getByRole('button', { name, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  // Aufräumen: Der Entwurf bleibt nicht liegen
  await page.getByRole('link', { name: 'Abbrechen' }).click()
  await page
    .getByRole('dialog', { name: 'Erfassung abbrechen?' })
    .getByRole('button', { name: 'Verwerfen' })
    .click()
  await expect(page).not.toHaveURL(/\/neu/)
})
