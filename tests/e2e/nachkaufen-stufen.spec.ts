import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Nachkaufen je Stufe (#284, #288): Kompakt steht „Ausblenden“ unter dem Text, damit Titel höchstens
// zweizeilig umbrechen. Ab „mittel“ steht der Knopf rechts in der Zeile, mit Falz (Seite auf dem
// rechten Bildschirm, #253) wieder darunter wie kompakt. Ab „breit“ ist der Inhalt
// eine Lesespalte von höchstens 768 px. Diese Tests ändern nichts.

const BREIT = 900
const READING_COLUMN_MAX = 768
const MAX_TITLE_LINES = 2
const EDGE = 24

const sizeOf = (page: Page) => page.viewportSize() ?? { width: 0, height: 0 }
const isCompact = (page: Page) => {
  const { width, height } = sizeOf(page)
  return width < BREIT && (width < 640 || height < 700)
}
const gapList = (page: Page) => page.getByRole('list', { name: 'Fehlt bis zum Ziel' })

async function openRestock(page: Page): Promise<Locator> {
  await page.goto('/nachkaufen')
  const gaps = gapList(page)
  await expect(gaps.getByRole('listitem').first()).toBeVisible()
  return gaps
}

// Zeilenzahl jedes Titels (erstes Block-Element der Zeile) aus Höhe und Zeilenhöhe
async function titleLineCounts(gaps: Locator): Promise<number[]> {
  return gaps.evaluate((list) =>
    [...list.querySelectorAll('li')].map((item) => {
      const title = item.querySelector<HTMLElement>('span.block')
      if (title === null) return Number.NaN
      const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight)
      return Math.round(title.getBoundingClientRect().height / lineHeight)
    }),
  )
}

async function hideButtonBelowTitle(row: Locator): Promise<boolean> {
  const [title, button] = await Promise.all([
    row.locator('span.block').first().boundingBox(),
    row.getByRole('button', { name: /^Ausblenden/ }).boundingBox(),
  ])
  if (title === null || button === null) throw new Error('Titel oder Knopf fehlt')
  return button.y >= title.y + title.height
}

test('kompakt und mit Falz: Titel höchstens zweizeilig, „Ausblenden“ unter dem Text', async ({
  page,
  fold,
}) => {
  test.skip(!isCompact(page) && fold === null, 'Nur in „kompakt“ und mit Falz')
  const gaps = await openRestock(page)

  const lines = await titleLineCounts(gaps)
  expect(lines.length).toBeGreaterThan(0)
  for (const count of lines) expect(count).toBeLessThanOrEqual(MAX_TITLE_LINES)
  expect(await hideButtonBelowTitle(gaps.getByRole('listitem').first())).toBe(true)
})

test('ab „mittel“ ohne Falz: „Ausblenden“ steht rechts in der Zeile', async ({ page, fold }) => {
  test.skip(isCompact(page) || fold !== null, 'Erst ab „mittel“, ohne Falz')
  const gaps = await openRestock(page)

  expect(await hideButtonBelowTitle(gaps.getByRole('listitem').first())).toBe(false)
  for (const count of await titleLineCounts(gaps)) expect(count).toBe(1)
})

test('ab „breit“: Inhalt höchstens 768 px breit, links ausgerichtet', async ({ page }) => {
  test.skip(sizeOf(page).width < BREIT, 'Seitenleiste und Lesespalte erst ab 900 px')
  await page.setViewportSize({ width: 1440, height: 900 })
  const gaps = await openRestock(page)

  const [list, field, main] = await Promise.all([
    gaps.boundingBox(),
    page.getByLabel('Eintrag ergänzen').boundingBox(),
    page.getByRole('main').boundingBox(),
  ])
  if (list === null || field === null || main === null) throw new Error('Inhalt fehlt')
  // Gruppe und Feld liegen in derselben Spalte, 24 px vom linken Rand des Inhalts
  expect(list.width).toBeLessThanOrEqual(READING_COLUMN_MAX)
  expect(field.width).toBeLessThanOrEqual(READING_COLUMN_MAX)
  expect(Math.abs(list.x - field.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(list.x - (main.x + EDGE))).toBeLessThanOrEqual(1)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Nachkaufen ist in jeder Stufe barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await openRestock(page)
    await expectAccessibleLayout(page)
  })
}
