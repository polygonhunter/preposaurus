// MHD-Schnellknöpfe „+6 Mon. · +1 J. · +2 J.“ (#180): nur auf Tippen, das Datum ist geschätzt,
// monatsgenau, immer ein MHD und steht mit „ca.“ da. Der erste Test speichert und läuft nur im
// Projekt „desktop“, je Versuch mit einer eigenen Lebensmittelart (attemptOf). Der zweite speichert
// nichts und läuft in jeder Stufe.
import type { Page, TestInfo } from '@playwright/test'
import { attemptOf } from '../helpers/attempt'
import { expect, test } from '../helpers/e2e-test'
import { createOwnFoodType } from '../helpers/own-food-type'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

const form = (page: Page) => page.getByRole('form', { name: 'Produkt erfassen' })
const quickPicks = (page: Page) => page.getByRole('group', { name: /Geschätzt ab heute/ })

/** Heute in deutscher Zeit plus Monate als „MM/JJJJ“, wie die App das geschätzte Monatsende zeigt. */
function monthFromNow(months: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date())
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value)
  const index = part('year') * 12 + part('month') - 1 + months
  return `${String((index % 12) + 1).padStart(2, '0')}/${String(Math.floor(index / 12))}`
}

async function expectAccessibleInBothSchemes(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
  await page.emulateMedia({ colorScheme: 'light' })
}

async function startWithOwnFoodType(page: Page, testInfo: TestInfo) {
  const name = `Schätzmehl ${String(attemptOf(testInfo))}`
  await createOwnFoodType(page, 'Mehl, Grieß und Stärke', name)
  await page.goto('/neu/manuell')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill(name)
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  await page.getByLabel('Inhalt je Packung').fill('1 g')
  return name
}

test('Schnellknopf: geschätztes MHD mit „ca.“, immer ein MHD, gespeichert', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
  test.slow()
  const name = await startWithOwnFoodType(page, testInfo)
  const estimate = `ca. ${monthFromNow(6)}`

  // Nichts ist vorbelegt, erst das Tippen setzt das Datum
  const dates = form(page).getByRole('list', { name: 'MHD und Anzahl' })
  await expect(dates).toHaveCount(0)
  await quickPicks(page).getByRole('button', { name: 'In 6 Monaten (geschätzt)' }).click()

  await expect(dates.getByRole('listitem')).toHaveText([
    new RegExp(`${estimate.replace('.', '\\.')}.*1×.*Geschätzt, kein Aufdruck`),
  ])
  await expect(
    page.getByRole('status').filter({ hasText: `Geschätzt, kein Aufdruck: ${estimate}.` }),
  ).toBeVisible()
  // Eine Schätzung ist nie ein Verbrauchsdatum: kein Umschalter für diese Zeile
  await expect(page.getByRole('radiogroup', { name: `Datumsart für ${estimate}` })).toHaveCount(0)
  await expect(form(page).getByRole('list', { name: 'Zusammenfassung' })).toContainText(
    `${estimate} (1×)`,
  )
  await expectAccessibleInBothSchemes(page)

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()

  // Im Vorrat steht die Schätzung ebenfalls mit „ca.“
  await page.goto('/vorrat/getreide')
  await page
    .getByRole('listitem')
    .getByRole('link', { name: new RegExp(`^${name}`) })
    .click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(
    page.getByRole('button', { name: new RegExp(`^${estimate.replace('.', '\\.')}`) }),
  ).toBeVisible()
})

test('Schnellknöpfe passen in jede Stufe, Ziel mindestens 44 px', async ({ page, fold }) => {
  const width = page.viewportSize()?.width ?? 0
  await page.goto('/neu/manuell')
  const group = quickPicks(page)
  const names = ['In 6 Monaten (geschätzt)', 'In 1 Jahr (geschätzt)', 'In 2 Jahren (geschätzt)']
  for (const buttonName of names) {
    const button = group.getByRole('button', { name: buttonName })
    await expect(button).toBeVisible()
    const box = await button.boundingBox()
    expect(box === null ? width + 1 : box.x + box.width).toBeLessThanOrEqual(width)
    const target = await button.evaluate((element) => {
      const after = getComputedStyle(element, '::after')
      return Math.min(Number.parseFloat(after.height), Number.parseFloat(after.width))
    })
    expect(target).toBeGreaterThanOrEqual(44)
  }

  // Mit der Tastatur erreichbar und auslösbar
  await group.getByRole('button', { name: 'In 1 Jahr (geschätzt)' }).focus()
  await page.keyboard.press('Enter')
  await expect(form(page).getByRole('list', { name: 'MHD und Anzahl' })).toContainText(
    `ca. ${monthFromNow(12)}`,
  )
  await expectAccessibleLayout(page)
  if (fold !== null) await expectNothingOnVerticalFold(page)
})
