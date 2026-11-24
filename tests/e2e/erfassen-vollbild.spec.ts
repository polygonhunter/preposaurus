import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Erfassen im Vollbild (UX_KONZEPT §6, #285): kompakt und mittel ohne Tab-Leiste, ab „breit“ mit
// Seitenleiste, überall „Abbrechen“ oben links. Es führt zurück auf die letzte Seite im Rahmen,
// ohne sie zur Übersicht, und fragt vorher, wenn Eingaben verloren gingen. Diese Tests öffnen nur
// /neu/manuell (nie /neu, das den Foto-Entwurf des Admins anfasst) und speichern nichts. Den
// Foto-Weg mit Entwurf prüft erfassen-foto.spec.ts.

const BREIT = 900

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' })
const cancel = (page: Page) => page.getByRole('link', { name: 'Abbrechen' })
const leaveSheet = (page: Page) => page.getByRole('dialog', { name: 'Erfassung abbrechen?' })
const content = (page: Page) => page.getByLabel('Inhalt je Packung')

/** Erst eine Seite im Rahmen öffnen, die sich „Abbrechen“ merkt, dann das Formular. */
async function openFormFrom(page: Page, path: string) {
  await page.goto(path)
  await waitForHydration(page)
  await openForm(page)
}

async function openForm(page: Page) {
  await page.goto('/neu/manuell')
  await expect(page.getByRole('form', { name: 'Produkt erfassen' })).toBeVisible()
  await waitForHydration(page)
}

test('kompakt und mittel: Vollbild ohne Tab-Leiste, „Abbrechen“ oben links', async ({ page }) => {
  test.skip(widthOf(page) >= BREIT, 'Tab-Leiste gibt es nur unter 900 px')
  await openForm(page)

  await expect(mainNav(page)).toHaveCount(0)
  await expect(page).toHaveTitle('Erfassen · Preposaurus')
  const heading = page.getByRole('heading', { level: 1, name: 'Erfassen' })
  const [cancelBox, headingBox] = await Promise.all([
    cancel(page).boundingBox(),
    heading.boundingBox(),
  ])
  expect(cancelBox?.y ?? 0).toBeLessThan(headingBox?.y ?? 0)
  expect(cancelBox?.x ?? 0).toBeLessThan(widthOf(page) / 2)
  // Ohne Tab-Leiste endet der Inhalt nicht mehr 74 px über dem Rand
  const padding = await page
    .getByRole('main')
    .evaluate((main) => Number.parseFloat(getComputedStyle(main).paddingBottom))
  expect(padding).toBeLessThan(10)
})

test('ab „breit“: Seitenleiste bleibt, Erfassen ist die aktuelle Seite', async ({ page }) => {
  test.skip(widthOf(page) < BREIT, 'Seitenleiste erst ab 900 px')
  await openForm(page)

  await expect(mainNav(page).getByRole('link', { name: 'Erfassen' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(cancel(page)).toBeVisible()
})

test('„Abbrechen“ ohne Eingaben führt gleich zurück auf die vorige Seite', async ({ page }) => {
  await openFormFrom(page, '/nachkaufen')

  await cancel(page).click()

  await expect(page).toHaveURL(/\/nachkaufen$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible()
  await expect(leaveSheet(page)).toHaveCount(0)
})

test('ohne vorige Seite führt „Abbrechen“ zur Übersicht', async ({ page }) => {
  await openForm(page)

  await cancel(page).click()

  await expect(page).toHaveURL(/\/uebersicht$/)
})

test('„Abbrechen“ mit Eingaben fragt ruhig nach, Weiter erfassen behält alles', async ({
  page,
}) => {
  await openFormFrom(page, '/statistik')
  await content(page).fill('500 g')

  // Per Tastatur, weil WebKit einen Link beim Klicken nicht fokussiert
  await cancel(page).focus()
  await page.keyboard.press('Enter')
  const sheet = leaveSheet(page)
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('noch nicht gespeichert')
  await expect(sheet.getByRole('button', { name: 'Weiter erfassen' })).toBeFocused()

  // Escape ist ein Ausweg ohne Verlust, der Fokus kehrt auf „Abbrechen“ zurück
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
  await expect(cancel(page)).toBeFocused()
  await expect(content(page)).toHaveValue('500 g')
  await expect(page).toHaveURL(/\/neu\/manuell$/)

  await cancel(page).click()
  await sheet.getByRole('button', { name: 'Weiter erfassen' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(content(page)).toHaveValue('500 g')

  await cancel(page).click()
  await sheet.getByRole('button', { name: 'Verwerfen' }).click()
  await expect(page).toHaveURL(/\/statistik$/)
})

test('ab „breit“: die Seitenleiste fragt bei Eingaben wie „Abbrechen“', async ({ page }) => {
  test.skip(widthOf(page) < BREIT, 'Seitenleiste erst ab 900 px')
  await openFormFrom(page, '/statistik')
  await content(page).fill('500 g')
  const stockLink = mainNav(page).getByRole('link', { name: 'Vorrat', exact: true })

  await stockLink.click()
  const sheet = leaveSheet(page)
  await expect(sheet).toBeVisible()
  await expect(page).toHaveURL(/\/neu\/manuell$/)
  await sheet.getByRole('button', { name: 'Weiter erfassen' }).click()
  await expect(content(page)).toHaveValue('500 g')

  await stockLink.click()
  await sheet.getByRole('button', { name: 'Verwerfen' }).click()
  await expect(page).toHaveURL(/\/vorrat$/)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Vollbild und Rückfrage sind barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await openForm(page)
    await expectAccessibleLayout(page)

    await content(page).fill('500 g')
    await cancel(page).click()
    await expect(leaveSheet(page)).toBeVisible()
    await expectAccessibleLayout(page)
  })
}
