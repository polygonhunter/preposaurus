// Umschalter „MHD · Verbrauchsdatum“ (#294, #300): beim Erfassen je Datumseintrag, beim „Datum
// ändern“ für die Zeile. Ein Verbrauchsdatum bekommt kein „Noch gut“, zurück zum MHD geht bewusst
// und sichtbar. Die beiden ersten Tests legen Daten an und laufen nur im Projekt „desktop“, je
// Versuch mit einer eigenen Lebensmittelart (attemptOf). Der dritte speichert nichts und läuft in
// jeder Stufe.
import type { Page, TestInfo } from '@playwright/test'
import { attemptOf } from '../helpers/attempt'
import { expect, test } from '../helpers/e2e-test'
import { createOwnFoodType } from '../helpers/own-food-type'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

const DAY_MS = 24 * 60 * 60 * 1000
const BREIT = 900
const WEIT = 1280
const DOWNGRADE_NOTE = 'Diese Packungen gelten danach als MHD, nicht mehr als Verbrauchsdatum.'

/** Gestern in deutscher Zeit als „TT.MM.JJJJ“: abgelaufen, also mit „Noch gut“ für ein MHD. */
const yesterdayInBerlin = () =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.now() - DAY_MS))

const bestBefore = (page: Page) => page.getByLabel('Mindestens haltbar bis')
const form = (page: Page) => page.getByRole('form', { name: 'Produkt erfassen' })
const kindChoice = (page: Page, name: string) => page.getByRole('radiogroup', { name, exact: true })
const onlyDesktop = (testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
  // Erfassen, Bald fällig, Detail und axe hell/dunkel in einem Ablauf
  test.slow()
}

async function expectAccessibleInBothSchemes(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
  await page.emulateMedia({ colorScheme: 'light' })
}

/** Eigene Art je Versuch anlegen und im Formular wählen, Inhalt klein (Vorratstage bleiben). */
async function startWithOwnFoodType(page: Page, testInfo: TestInfo, prefix: string) {
  const name = `${prefix} ${String(attemptOf(testInfo))}`
  await createOwnFoodType(page, 'Mehl, Grieß und Stärke', name)
  await page.goto('/neu/manuell')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill(name)
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  await page.getByLabel('Inhalt je Packung').fill('1 g')
  return name
}

async function openDateRow(page: Page, name: string, date: string) {
  await page.goto('/uebersicht/bald-faellig')
  const entry = page.getByRole('link', { name: `× ${name}` })
  await page.goto((await entry.getAttribute('href')) ?? '')
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  const dateRow = page.getByRole('button', { name: new RegExp(`^${date}`) })
  await dateRow.click()
  return { dateRow, sheet: page.getByRole('dialog', { name: `${name} · ${date}` }) }
}

test('Erfassen: Umschalter je Datum, Verbrauchsdatum ohne „Noch gut“', async ({
  page,
}, testInfo) => {
  onlyDesktop(testInfo)
  const date = yesterdayInBerlin()
  const name = await startWithOwnFoodType(page, testInfo, 'Umschaltmehl')
  await bestBefore(page).fill(date)
  await bestBefore(page).press('Enter')

  // Standard MHD, umschalten per Klick: Die Zeile sagt es, der Fokus bleibt auf der Wahl
  const asBestBefore = kindChoice(page, `Datumsart für ${date}`)
  await expect(asBestBefore.getByRole('radio', { name: 'MHD' })).toBeChecked()
  await expect(form(page)).toContainText('Verbrauchsdatum: nach diesem Tag nicht mehr essen.')
  await asBestBefore.getByText('Verbrauchsdatum', { exact: true }).click()
  const asUseBy = kindChoice(page, `Datumsart für ${date} (Verbrauchsdatum)`)
  const useByRadio = asUseBy.getByRole('radio', { name: 'Verbrauchsdatum' })
  await expect(useByRadio).toBeChecked()
  await expect(useByRadio).toBeFocused()
  const dates = form(page).getByRole('list', { name: 'MHD und Anzahl' })
  await expect(dates.getByRole('listitem')).toHaveText([
    new RegExp(`${date} \\(Verbrauchsdatum\\).*1×`),
  ])

  // Mit Pfeiltasten hin und zurück, der Fokus folgt der neuen Zeile
  await page.keyboard.press('ArrowLeft')
  await expect(asBestBefore.getByRole('radio', { name: 'MHD' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(useByRadio).toBeFocused()
  await expectAccessibleInBothSchemes(page)

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()

  // Bald fällig und Detail: Verbrauchsdatum, kein „Noch gut“
  await page.goto('/uebersicht/bald-faellig')
  await expect(page.getByRole('link', { name: `× ${name}` })).toContainText('Verbrauchsdatum')
  await expect(page.getByRole('button', { name: `${name} noch gut` })).toHaveCount(0)
  const { dateRow, sheet } = await openDateRow(page, name, date)
  await expect(dateRow).toContainText('Verbrauchsdatum')
  await expect(sheet.getByRole('button', { name: 'Noch gut' })).toHaveCount(0)
})

test('Datum ändern: Art wechseln, zurück zum MHD sichtbar, per Vorsatz wieder hin', async ({
  page,
}, testInfo) => {
  onlyDesktop(testInfo)
  const date = yesterdayInBerlin()
  const name = await startWithOwnFoodType(page, testInfo, 'Wechselmehl')
  await bestBefore(page).fill(`zu verbrauchen bis ${date}`)
  await bestBefore(page).press('Enter')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()

  // Vorbelegt mit der Art der Zeile; MHD gewählt sagt der Satz, was passiert
  let { sheet } = await openDateRow(page, name, date)
  await sheet.getByRole('link', { name: 'Datum ändern' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Datum ändern' })).toBeVisible()
  const choice = kindChoice(page, 'Datumsart')
  await expect(choice.getByRole('radio', { name: 'Verbrauchsdatum' })).toBeChecked()
  await expect(page.getByLabel('Zu verbrauchen bis')).toBeVisible()
  await choice.getByText('MHD', { exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: DOWNGRADE_NOTE })).toBeVisible()
  await bestBefore(page).fill(date)
  await expectAccessibleInBothSchemes(page)
  await page.getByRole('button', { name: 'Speichern' }).click()

  // Jetzt ein MHD: abgelaufen mit „Noch gut“
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  const dateRow = page.getByRole('button', { name: new RegExp(`^${date}`) })
  await expect(dateRow).not.toContainText('Verbrauchsdatum')
  await dateRow.click()
  sheet = page.getByRole('dialog', { name: `${name} · ${date}` })
  await expect(sheet.getByRole('button', { name: 'Noch gut' })).toBeVisible()

  // „zu verbrauchen bis“ getippt schaltet den Umschalter wieder um
  await sheet.getByRole('link', { name: 'Datum ändern' }).click()
  await expect(choice.getByRole('radio', { name: 'MHD' })).toBeChecked()
  await bestBefore(page).fill(`zu verbrauchen bis ${date}`)
  await expect(choice.getByRole('radio', { name: 'Verbrauchsdatum' })).toBeChecked()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(`^${date}`) })).toContainText(
    'Verbrauchsdatum',
  )
})

test('Umschalter passt in jede Stufe, Ziel mindestens 44 px', async ({ page }) => {
  const width = page.viewportSize()?.width ?? 0
  await page.goto('/neu/manuell')
  await bestBefore(page).fill('09/2027')
  await bestBefore(page).press('Enter')
  const choice = kindChoice(page, 'Datumsart für 09/2027')
  await expect(choice).toBeVisible()

  const box = await choice.boundingBox()
  expect(box === null ? width + 1 : box.x + box.width).toBeLessThanOrEqual(width)
  const targetHeights = await choice
    .locator('label > span')
    .evaluateAll((segments) =>
      segments.map((segment) => Number.parseFloat(getComputedStyle(segment, '::after').height)),
    )
  for (const height of targetHeights) expect(height).toBeGreaterThanOrEqual(44)
  await expectAccessibleLayout(page)
  if (width >= BREIT && width < WEIT) await expectNothingOnVerticalFold(page)

  // Gleiches Datum, neue Art, die es schon gibt: eine Zeile, Anzahl addiert, und es wird gesagt
  await bestBefore(page).fill('zu verbrauchen bis 09/2027')
  await bestBefore(page).press('Enter')
  await choice.getByText('Verbrauchsdatum', { exact: true }).click()
  const dates = form(page).getByRole('list', { name: 'MHD und Anzahl' })
  await expect(dates.getByRole('listitem')).toHaveText([/09\/2027 \(Verbrauchsdatum\).*2×/])
  await expect(page.getByRole('status').filter({ hasText: 'Zusammengeführt' })).toBeVisible()
})
