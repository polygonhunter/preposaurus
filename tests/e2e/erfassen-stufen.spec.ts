import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

// Manuelles Erfassen je Stufe (M12-06, #95): kompakt eine Spalte, ab „breit“ links das Produkt
// (Lebensmittelart, Inhalt, Behälter), rechts Daten, Anzahl, Zusammenfassung und Speichern. Die
// Foto-Erfassung je Stufe steht in erfassen-foto.spec.ts. Diese Tests speichern nichts.

const BREIT = 900
const WEIT = 1280

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const content = (page: Page) => page.getByLabel('Inhalt je Packung')
const bestBefore = (page: Page) => page.getByLabel('Mindestens haltbar bis')

async function openForm(page: Page) {
  await page.goto('/neu/manuell')
  await expect(page.getByRole('form', { name: 'Produkt erfassen' })).toBeVisible()
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('Element ist nicht sichtbar')
  return box
}

async function boxesOf(page: Page) {
  const [contentBox, dateBox, saveBox] = await Promise.all([
    boxOf(content(page)),
    boxOf(bestBefore(page)),
    boxOf(page.getByRole('button', { name: 'Speichern' })),
  ])
  return { contentBox, dateBox, saveBox }
}

test('kompakt und mittel: eine Spalte, das MHD folgt unter dem Inhalt', async ({ page }) => {
  test.skip(widthOf(page) >= BREIT, 'Nur unter „breit“')
  await openForm(page)
  const { contentBox, dateBox } = await boxesOf(page)

  expect(dateBox.y).toBeGreaterThan(contentBox.y)
  expect(Math.abs(dateBox.x - contentBox.x)).toBeLessThan(2)
})

test.describe('ab „breit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < BREIT, 'Zweispaltig erst ab 900 px')
  })

  test('Produkt links, MHD und Speichern rechts', async ({ page }) => {
    await openForm(page)
    const { contentBox, dateBox, saveBox } = await boxesOf(page)

    const productRight = contentBox.x + contentBox.width
    expect(dateBox.x).toBeGreaterThan(productRight)
    expect(saveBox.x).toBeGreaterThan(productRight)
    // Beide Spalten beginnen oben
    expect(Math.abs(dateBox.y - contentBox.y)).toBeLessThan(400)
  })

  test('nichts Antippbares auf der Falz (Duo quer)', async ({ page }) => {
    test.skip(widthOf(page) >= WEIT, 'Am PC gibt es keine Falz')
    await openForm(page)
    await expectNothingOnVerticalFold(page)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`zweispaltiges Formular ist barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await openForm(page)
      await expectAccessibleLayout(page)
    })
  }
})
