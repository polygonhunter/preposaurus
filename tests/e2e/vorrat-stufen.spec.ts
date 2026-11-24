import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

// Vorrat je Stufe (DESIGN_SYSTEM §6, #92 bis #94) mit dem Beispielvorrat: kompakt Liste und Detail als
// eigene Seiten, mittel Liste oben und Detail unten, ab „breit“ nebeneinander, ab „weit“ die Tabelle.
// Diese Tests ändern nichts; Entnehmen steht in vorrat-entnehmen.spec.ts.

const BREIT = 900
const WEIT = 1280
const GRAIN = 'Getreide und Kartoffeln'

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const heightOf = (page: Page) => page.viewportSize()?.height ?? 0
const isMiddle = (page: Page) =>
  widthOf(page) >= 640 && widthOf(page) < BREIT && heightOf(page) >= 700
const sideList = (page: Page) => page.getByRole('region', { name: 'Vorrat' })
const title = (page: Page, name: string) => page.getByRole('heading', { level: 1, name })

async function openOats(page: Page) {
  await page.goto('/vorrat/getreide')
  await page.getByRole('link', { name: /^Haferflocken/ }).click()
  await expect(page).toHaveURL(/\/vorrat\/art\/[0-9a-f-]+$/)
  await expect(title(page, 'Haferflocken')).toBeVisible()
}

test('kompakt: Detail steht allein, „Zurück“ führt zur Warengruppe', async ({ page }) => {
  test.skip(isMiddle(page) || widthOf(page) >= BREIT, 'Nur in der Stufe kompakt')
  await openOats(page)

  await expect(sideList(page)).toBeHidden()
  await page.getByRole('link', { name: GRAIN }).first().click()
  await expect(title(page, GRAIN)).toBeVisible()
})

test('mittel: Liste oben, Detail unten, nichts auf der Falz', async ({ page }) => {
  test.skip(!isMiddle(page), 'Nur in der Stufe mittel')
  await openOats(page)
  const fold = heightOf(page) / 2
  const [listBox, titleBox] = await Promise.all([
    sideList(page).boundingBox(),
    title(page, 'Haferflocken').boundingBox(),
  ])

  expect((listBox?.y ?? 0) + (listBox?.height ?? 0)).toBeLessThanOrEqual(fold - 12)
  expect(titleBox?.y ?? 0).toBeGreaterThanOrEqual(fold + 12)
  await expect(sideList(page).getByRole('link', { name: /^Haferflocken/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test.describe('ab „breit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < BREIT, 'Liste und Detail nebeneinander erst ab 900 px')
  })

  test('Auswahl ändert die Adresse, Zurück wählt die vorige Zeile', async ({ page }) => {
    await openOats(page)
    const oats = sideList(page).getByRole('link', { name: /^Haferflocken/ })
    await expect(oats).toHaveAttribute('aria-current', 'page')
    const oatsUrl = page.url()

    await sideList(page)
      .getByRole('link', { name: /^Nudeln/ })
      .click()
    await expect(title(page, 'Nudeln')).toBeVisible()
    expect(page.url()).not.toBe(oatsUrl)
    await expect(sideList(page).getByRole('link', { name: /^Nudeln/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.goBack()
    await expect(page).toHaveURL(oatsUrl)
    await expect(title(page, 'Haferflocken')).toBeVisible()
    await expect(oats).toHaveAttribute('aria-current', 'page')
  })

  test('Liste und Detail lassen die Falz frei (Duo quer)', async ({ page, fold }) => {
    test.skip(fold === null, 'Nur mit Falz')
    await openOats(page)
    await expectNothingOnVerticalFold(page)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Liste und Detail sind barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await openOats(page)

      await expect(sideList(page)).toBeVisible()
      await expectAccessibleLayout(page)
    })
  }
})

test.describe('ab „weit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < WEIT, 'Tabelle erst ab 1280 px')
  })

  test('Vorrat ist eine Tabelle mit Warengruppen als Zwischenzeile', async ({ page }) => {
    await page.goto('/vorrat')
    const table = page.getByRole('table', { name: 'Vorrat' })

    await expect(table.getByRole('columnheader')).toHaveText([
      'Lebensmittel',
      'Packungen',
      'Menge',
      'kcal',
      'Satt für',
      'Nächstes MHD',
    ])
    await expect(table.getByRole('rowheader', { name: GRAIN })).toBeVisible()
    await expect(table.getByRole('rowheader', { name: 'Haferflocken' })).toBeVisible()
    // Die Liste der Warengruppen steht nur bis „weit“
    await expect(page.getByRole('list', { name: 'Warengruppen' })).toBeHidden()
  })

  test('Zeile öffnet das Detail rechts, die Zeile bleibt markiert', async ({ page }) => {
    await page.goto('/vorrat')
    await page
      .getByRole('table', { name: 'Vorrat' })
      .getByRole('link', { name: 'Haferflocken' })
      .click()

    await expect(title(page, 'Haferflocken')).toBeVisible()
    const table = sideList(page).getByRole('table', { name: 'Vorrat' })
    await expect(table.getByRole('link', { name: 'Haferflocken' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const [tableBox, titleBox] = await Promise.all([
      table.boundingBox(),
      title(page, 'Haferflocken').boundingBox(),
    ])
    expect(titleBox?.x ?? 0).toBeGreaterThan((tableBox?.x ?? 0) + (tableBox?.width ?? 0) - 1)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Tabelle ist barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/vorrat')
      await expect(page.getByRole('table', { name: 'Vorrat' })).toBeVisible()
      await expectAccessibleLayout(page)

      await openOats(page)
      await expectAccessibleLayout(page)
    })
  }
})
