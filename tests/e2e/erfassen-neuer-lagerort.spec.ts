// „+ Neuer Lagerort“ direkt aus der Erfassung (#301): Das Blatt legt den Ort an, ohne das Formular
// zu verlassen, und wählt ihn. Admin und Mitglied legen an (#298, Option a). Gleicher Name ohne
// Rücksicht auf Groß- und Kleinschreibung wählt den vorhandenen Ort. Alle Projekte teilen einen
// Haushalt, deshalb hat jeder neue Ort einen eigenen Namen je Projekt und Versuch. Den Foto-Weg
// prüft erfassen-foto.spec.ts (Entwurf des Admins, nacheinander).
import type { Page, TestInfo } from '@playwright/test'
import { attemptOf } from '../helpers/attempt'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const sheetOf = (page: Page) => page.getByRole('dialog', { name: 'Neuer Lagerort' })
const locationChip = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Lagerort' }).getByRole('button', { name, exact: true })
const nameFor = (role: string, testInfo: TestInfo) =>
  `Testregal ${role} ${testInfo.project.name} ${String(attemptOf(testInfo))}`

async function addLocation(page: Page, name: string) {
  await page.getByRole('button', { name: '+ Neuer Lagerort' }).click()
  const sheet = sheetOf(page)
  await sheet.getByLabel('Name des Lagerorts').fill(name)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
  await sheet.getByRole('button', { name: 'Anlegen' }).click()
  await expect(sheet).toBeHidden()
}

test.describe('als Admin', () => {
  test('legt im manuellen Weg einen Lagerort an und wählt ihn', async ({ page }, testInfo) => {
    const name = nameFor('Admin', testInfo)
    await page.goto('/neu/manuell')

    await addLocation(page, name)

    await expect(locationChip(page, name)).toHaveAttribute('aria-pressed', 'true')
    // Nach dem Neuladen steht der Ort in der Auswahl, wie jeder andere
    await page.goto('/neu/manuell')
    await expect(locationChip(page, name)).toBeVisible()
  })

  test('Gibt es den Ort schon, wird er gewählt statt doppelt angelegt', async ({ page }) => {
    await page.goto('/neu/manuell')
    await page.getByRole('button', { name: '+ Neuer Lagerort' }).click()
    const sheet = sheetOf(page)

    // Leer: Satz am Feld, nichts angelegt
    await sheet.getByRole('button', { name: 'Anlegen' }).click()
    await expect(sheet.getByText('Bitte einen Namen eintragen.')).toBeVisible()
    await sheet.getByLabel('Name des Lagerorts').fill('kELLER')
    await sheet.getByLabel('Name des Lagerorts').press('Enter')

    await expect(sheet).toBeHidden()
    await expect(locationChip(page, 'Keller')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('„Keller“ gab es schon, der Ort ist jetzt gewählt.')).toBeVisible()
    await expect(locationChip(page, 'kELLER')).toHaveCount(0)
    await expectAccessibleLayout(page)
  })
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('legt beim Erfassen einen Lagerort an und wählt ihn (#301)', async ({ page }, testInfo) => {
    const name = nameFor('Mitglied', testInfo)
    await signInViaUi(page, E2E_MEMBER)
    await page.goto('/neu/manuell')

    await addLocation(page, name)

    await expect(locationChip(page, name)).toHaveAttribute('aria-pressed', 'true')
    // Verwalten bleibt beim Admin: Unter Einstellungen steht der Ort nur lesend
    await page.goto('/einstellungen/lagerorte')
    await expect(page.getByRole('list', { name: 'Zur Wahl beim Erfassen' })).toContainText(name)
    await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)
  })
})
