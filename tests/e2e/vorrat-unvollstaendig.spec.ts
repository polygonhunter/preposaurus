import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Zähler an den Zustands-Chips und Grund je Zeile unter „Unvollständig“ (#221), in jeder Stufe mit
// dem Beispielvorrat: Haferflocken haben zwei Packungen, eine davon ohne Datum. Andere Tests legen
// parallel Packungen an, deshalb prüfen die Zähler nur die Form, nicht die genaue Zahl.
// Diese Tests ändern nichts.

const CHIP_LABELS = ['Im Vorrat', 'Bald fällig', 'Abgelaufen', 'Unvollständig']
const INCOMPLETE_PATH = '/vorrat?zustand=unvollstaendig'

const statusChips = (page: Page) => page.getByRole('group', { name: 'Zustand' }).getByRole('link')

async function expectCountedChips(page: Page) {
  const chips = statusChips(page)
  await expect(chips).toHaveCount(CHIP_LABELS.length)
  for (const [index, label] of CHIP_LABELS.entries()) {
    await expect(chips.nth(index)).toHaveAccessibleName(new RegExp(`^${label} \\d+$`))
  }
}

test('Chips tragen ihren Zähler im Namen, auch ohne Filter', async ({ page }) => {
  await page.goto('/vorrat')
  await expectCountedChips(page)

  await page.goto(INCOMPLETE_PATH)
  await expectCountedChips(page)
  const active = statusChips(page).filter({ hasText: 'Unvollständig' })
  await expect(active).toHaveAttribute('aria-current', 'true')
  // Der aktive Chip steht ganz rechts, die Reihe rollt ihn auch auf dem iPhone ins Bild (#96)
  await expect(active).toBeInViewport({ ratio: 1 })
})

test('„Unvollständig“ nennt je Zeile den Grund', async ({ page }) => {
  await page.goto(INCOMPLETE_PATH)
  const oats = page.getByRole('link', { name: /^Haferflocken/ })

  await expect(oats).toContainText('Datum fehlt (1 von 2)')
  await expect(oats).not.toContainText('unvollständig')
  // Sprudelwasser hat Datum und Nährwerte, es fehlt hier
  await expect(page.getByRole('link', { name: /^Sprudelwasser/ })).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Filter „Unvollständig“ ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto(INCOMPLETE_PATH)
    await expect(page.getByRole('link', { name: /^Haferflocken/ })).toBeVisible()

    await expectAccessibleLayout(page)
  })
}
