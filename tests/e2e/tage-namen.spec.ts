import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Namen der zwei Tage-Zahlen (#209) mit dem Beispielvorrat (beispielvorrat.setup.ts): „Menge reicht
// X von 10 Tagen“ (Abdeckung nach Menge), „Satt für X Tage“ (Beitrag nach kcal) und bei Wasser
// „Wasser für X Tage“. vorrat-entnehmen.spec.ts entnimmt parallel, deshalb nur Muster, keine Zahlen.
// Diese Tests ändern nichts.

const GRAIN = 'Getreide und Kartoffeln'
const WEIT = 1280

const AMOUNT = /Menge reicht [\d,]+ von 10 Tagen/
const FOOD = /Satt für [\d,]+ Tage?/
const WATER = /Wasser für [\d,]+ Tage?/

const isTable = (page: Page) => (page.viewportSize()?.width ?? 0) >= WEIT
const main = (page: Page) => page.getByRole('main')

const tile = (page: Page, label: string) =>
  main(page)
    .locator('dl > div')
    .filter({ has: page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }) })

test('Übersicht: „Menge reicht“ steht über den Warengruppen und im Messwert', async ({ page }) => {
  await page.goto('/uebersicht')
  const region = page.getByRole('region', { name: 'Warengruppen' })

  await expect(region.getByText('Menge reicht', { exact: true })).toBeVisible()
  await expect(region.getByRole('meter', { name: GRAIN })).toHaveAttribute(
    'aria-valuetext',
    /^Menge reicht [\d,]+ von 10 Tagen, Ziel 10 Tage$/,
  )
})

test('Ebene 1: jede Warengruppe nennt ihre Zahl mit Namen', async ({ page }) => {
  test.skip(isTable(page), 'Ab „weit“ steht Ebene 1 als Tabelle da (Test unten)')
  await page.goto('/vorrat')
  const groups = page.getByRole('list', { name: 'Warengruppen' })

  // Mit Mengenempfehlung die Abdeckung, ohne (Sonstiges) der Beitrag nach kcal
  await expect(groups.getByRole('link', { name: new RegExp(`^${GRAIN}`) })).toHaveAccessibleName(
    AMOUNT,
  )
  await expect(groups.getByRole('link', { name: /^Wasser/ })).toHaveAccessibleName(AMOUNT)
  await expect(groups.getByRole('link', { name: /^Sonstiges/ })).toHaveAccessibleName(FOOD)
})

test('ab „weit“: die Tabelle nennt die Spalte „Satt für“, Wasser nennt sich selbst', async ({
  page,
}) => {
  test.skip(!isTable(page), 'Tabelle erst ab 1280 px')
  await page.goto('/vorrat')
  const table = page.getByRole('table', { name: 'Vorrat' })

  await expect(table.getByRole('columnheader', { name: 'Satt für' })).toBeVisible()
  await expect(table.getByRole('row', { name: /Sprudelwasser/ })).toContainText(WATER)
})

test('Ebene 2: der Kopf nennt beide Zahlen, ohne Mengenempfehlung nur „Satt für“', async ({
  page,
}) => {
  await page.goto('/vorrat/getreide')
  await expect(main(page).getByText(AMOUNT)).toContainText(FOOD)

  await page.goto('/vorrat/wasser')
  await expect(main(page).getByText(AMOUNT)).toContainText(WATER)
  await expect(main(page).getByText(FOOD)).toHaveCount(0)

  await page.goto('/vorrat/sonstiges')
  await expect(main(page).getByText(FOOD)).toBeVisible()
  await expect(main(page).getByText(AMOUNT)).toHaveCount(0)
})

test('Detail: die Kachel heißt „Satt für“, bei Wasser „Wasser für“', async ({ page }) => {
  await page.goto('/vorrat/getreide')
  await main(page)
    .getByRole('link', { name: /^Haferflocken/ })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Haferflocken' })).toBeVisible()
  await expect(tile(page, 'Satt für').getByRole('definition')).toHaveText(/^[\d,]+ Tage?$/)
  await expect(tile(page, 'Tage')).toHaveCount(0)

  await page.goto('/vorrat/wasser')
  await main(page)
    .getByRole('link', { name: /^Sprudelwasser/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sprudelwasser' })).toBeVisible()
  await expect(tile(page, 'Wasser für').getByRole('definition')).toHaveText(/^[\d,]+ Tage?$/)
  await expect(tile(page, 'Satt für')).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Übersicht, Ebene 1 und Ebene 2 mit Namen sind barrierefrei (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme })
    for (const path of ['/uebersicht', '/vorrat', '/vorrat/getreide', '/vorrat/wasser']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectAccessibleLayout(page)
    }
  })
}
