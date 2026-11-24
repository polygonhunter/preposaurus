// „+ Neue Lebensmittelart“ direkt aus der Erfassung (#110, #142): Das Blatt legt die Art an, ohne
// das Formular zu verlassen, und wählt sie. Ähnliche Namen und Suchwörter führen zur vorhandenen
// Art. Admin und Mitglied legen an (#298). Alle Projekte teilen einen Haushalt,
// deshalb hat jede neue Art einen eigenen Namen je Projekt und Versuch. Den Vorschlag der Erkennung
// prüft erfassen-foto.spec.ts (Entwurf des Admins, nacheinander).
import type { Page } from '@playwright/test'
import { attemptOf } from '../helpers/attempt'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const search = (page: Page) => page.getByRole('searchbox', { name: 'Lebensmittelart suchen' })
const newFoodTypeSheet = (page: Page) => page.getByRole('dialog', { name: 'Neue Lebensmittelart' })
const offerFor = (page: Page, name: string) =>
  page.getByRole('button', { name: `+ „${name}“ als neue Lebensmittelart anlegen` })

async function chooseCategory(page: Page, name: string) {
  await newFoodTypeSheet(page)
    .getByRole('button', { name: /^Kategorie/ })
    .click()
  const picker = page.getByRole('dialog', { name: 'Kategorie wählen' })
  await picker.getByRole('searchbox', { name: 'Kategorie suchen' }).fill(name)
  await picker
    .getByRole('button', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) })
    .click()
  await expect(picker).toBeHidden()
}

test.describe('als Admin', () => {
  test('„+ Neue Lebensmittelart“ legt im manuellen Weg an und wählt die Art', async ({
    page,
  }, testInfo) => {
    const name = `Testfrucht ${testInfo.project.name} ${String(attemptOf(testInfo))}`
    await page.goto('/neu/manuell')
    await expect(page.getByRole('button', { name: '+ Neue Lebensmittelart' })).toBeVisible()

    await search(page).fill(name)
    await expect(page.getByText(/^Keine Lebensmittelart gefunden\. Versucht/)).toBeVisible()
    await offerFor(page, name).click()
    const sheet = newFoodTypeSheet(page)
    await expect(sheet.getByLabel('Name der Lebensmittelart')).toHaveValue(name)

    // Ohne Kategorie: Satz am Feld, nichts angelegt
    await sheet.getByRole('button', { name: 'Anlegen' }).click()
    await expect(sheet.getByText('Bitte eine Kategorie wählen.')).toBeVisible()
    await chooseCategory(page, 'Obst (frisch)')
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await expectAccessibleLayout(page)
    }

    await sheet.getByRole('button', { name: 'Anlegen' }).click()
    await expect(sheet).toBeHidden()
    await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
    const form = page.getByRole('form', { name: 'Produkt erfassen' })
    await expect(form).toContainText(name)
    await expect(form).toContainText('Obst und Nüsse › Obst (frisch)')
    await expect(page.getByLabel('Inhalt je Packung')).toBeFocused()

    // Die neue Art steht danach auch in der Suche
    await page.getByRole('button', { name: 'Lebensmittelart ändern' }).click()
    await search(page).fill(name)
    await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
  })

  test('Gibt es die Art schon (Name oder Suchwort), wird sie gewählt statt doppelt angelegt', async ({
    page,
  }) => {
    await page.goto('/neu/manuell')
    await search(page).fill('Spaghetti')
    await offerFor(page, 'Spaghetti').click()

    const sheet = newFoodTypeSheet(page)
    await expect(sheet.getByRole('status')).toContainText('Das gibt es schon: „Nudeln“')
    await expect(sheet.getByRole('button', { name: 'Anlegen' })).toHaveCount(0)
    await expectAccessibleLayout(page)
    await sheet.getByRole('button', { name: '„Nudeln“ wählen' }).click()

    await expect(sheet).toBeHidden()
    await expect(page.getByRole('form', { name: 'Produkt erfassen' })).toContainText('Nudeln')
    await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  })
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('legt eine neue Art mit Pflicht-Kategorie an und wählt sie (#298)', async ({
    page,
  }, testInfo) => {
    const name = `Testbeere ${testInfo.project.name} ${String(attemptOf(testInfo))}`
    await signInViaUi(page, E2E_MEMBER)
    await page.goto('/neu/manuell')
    await expect(search(page)).toBeFocused()
    await expect(page.getByRole('button', { name: '+ Neue Lebensmittelart' })).toBeVisible()

    await search(page).fill(name)
    await expect(page.getByText('Neue Lebensmittelarten legt ein Admin an.')).toHaveCount(0)
    await offerFor(page, name).click()
    const sheet = newFoodTypeSheet(page)
    await sheet.getByRole('button', { name: 'Anlegen' }).click()
    await expect(sheet.getByText('Bitte eine Kategorie wählen.')).toBeVisible()
    await chooseCategory(page, 'Obst (frisch)')
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await expectAccessibleLayout(page)
    }

    await sheet.getByRole('button', { name: 'Anlegen' }).click()
    await expect(sheet).toBeHidden()
    const form = page.getByRole('form', { name: 'Produkt erfassen' })
    await expect(form).toContainText(name)
    await expect(form).toContainText('Obst und Nüsse › Obst (frisch)')
    await expect(page.getByLabel('Inhalt je Packung')).toBeFocused()
  })
})
