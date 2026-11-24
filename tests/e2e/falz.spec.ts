import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { readFold } from '../helpers/fold'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

// Falz und Spaltenbreiten (#253, DESIGN_SYSTEM §6). Mit Falz (duo-quer, nachgestellt per Chromium)
// liegt auf keiner Seite etwas Antippbares darauf: Einspaltige Seiten stehen auf dem rechten
// Bildschirm, Seiten mit Liste und Detail haben die Falz in der Fuge. Ohne Falz (pc-schmal, 960 px)
// ist die Liste neben dem Detail mindestens 320 px breit. Diese Tests ändern nichts.

const MIN_LIST_WIDTH = 320

// Einspaltige Seiten, je eine Adresse
const SINGLE_COLUMN_PATHS = [
  '/uebersicht',
  '/uebersicht/bald-faellig',
  '/vorrat',
  '/vorrat/getreide',
  '/vorrat?suche=Nudeln',
  '/vorrat/verlauf',
  '/nachkaufen',
  '/statistik',
]

// Seiten mit zwei Spalten: Liste bzw. Formular links, Bereich rechts
const SPLIT_PATHS = ['/einstellungen', '/einstellungen/ziel', '/neu/manuell']

const stockList = (page: Page) => page.getByRole('region', { name: 'Vorrat' })
const settingsList = (page: Page) =>
  page.getByRole('region', { name: 'Bereiche der Einstellungen' })
const heading = (page: Page) => page.getByRole('heading', { level: 1 })

async function openOats(page: Page) {
  await page.goto('/vorrat/getreide')
  await page.getByRole('link', { name: /^Haferflocken/ }).click()
  await expect(page).toHaveURL(/\/vorrat\/art\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Haferflocken' })).toBeVisible()
}

async function widthOf(locator: Locator): Promise<number> {
  return (await locator.boundingBox())?.width ?? 0
}

async function foldOf(page: Page) {
  const fold = await readFold(page)
  expect(fold, 'Keine Falz nachgestellt').not.toBeNull()
  return fold ?? { start: 0, end: 0 }
}

test.describe('mit Falz', () => {
  test.beforeEach(({ fold }) => {
    test.skip(fold === null, 'Nur mit Falz (Duo quer)')
  })

  test('einspaltige Seiten stehen rechts der Falz, nichts liegt darauf', async ({ page }) => {
    for (const path of SINGLE_COLUMN_PATHS) {
      await page.goto(path)
      await expect(heading(page)).toBeVisible()
      const fold = await foldOf(page)
      const box = await heading(page).boundingBox()
      expect(box?.x ?? 0, path).toBeGreaterThanOrEqual(fold.end)
      await expectNothingOnVerticalFold(page)
    }
  })

  test('Seiten mit zwei Spalten haben die Falz in der Fuge', async ({ page }) => {
    for (const path of SPLIT_PATHS) {
      await page.goto(path)
      await expect(heading(page)).toBeVisible()
      await expectNothingOnVerticalFold(page)
    }
    await openOats(page)
    const fold = await foldOf(page)
    const list = await stockList(page).boundingBox()
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(fold.start)
    await expectNothingOnVerticalFold(page)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Übersicht und Detail mit Falz sind barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/uebersicht')
      await expect(heading(page)).toBeVisible()
      await expectAccessibleLayout(page)
      await openOats(page)
      await expectAccessibleLayout(page)
    })
  }
})

test.describe('ohne Falz im schmalen PC-Fenster', () => {
  test.beforeEach(({ page, fold }) => {
    const width = page.viewportSize()?.width ?? 0
    test.skip(fold !== null || width < 900 || width >= 1280, 'Nur im PC-Fenster 900 bis 1279 px')
  })

  test('die Liste neben dem Detail ist mindestens 320 px breit, das Detail bekommt den Rest', async ({
    page,
  }) => {
    await openOats(page)
    const listWidth = await widthOf(stockList(page))
    expect(listWidth).toBeGreaterThanOrEqual(MIN_LIST_WIDTH)
    const detail = await page.getByRole('heading', { level: 1, name: 'Haferflocken' }).boundingBox()
    expect(detail?.x ?? 0).toBeGreaterThan(listWidth)

    await page.goto('/einstellungen/ziel')
    expect(await widthOf(settingsList(page))).toBeGreaterThanOrEqual(MIN_LIST_WIDTH)
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Liste und Detail sind barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await openOats(page)
      await expectAccessibleLayout(page)
      await page.goto('/einstellungen/ziel')
      await expectAccessibleLayout(page)
    })
  }
})
