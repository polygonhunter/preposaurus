import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectNotice, noticeBar } from '../helpers/notice-bar'
import { expectAccessibleLayout } from '../helpers/page-checks'

// „−1“, „1 entnehmen“ und „Verbraucht“ mit Rückgängig (#46, #125). Die Tests ändern den
// Beispielhaushalt und machen es danach rückgängig. Damit sich parallel laufende Projekte nicht
// in die Quere kommen, laufen sie nur auf iPhone und Desktop, jeweils mit eigenem Lebensmittel.

type Picks = Readonly<{
  list: { groupKey: string; name: string }
  detail: { groupKey: string; name: string }
  due: string
}>

const PICKS: Readonly<Record<string, Picks>> = {
  iphone: {
    list: { groupKey: 'wasser', name: 'Sprudelwasser' },
    detail: { groupKey: 'sonstiges', name: 'Ravioli' },
    due: 'Walnüsse',
  },
  desktop: {
    list: { groupKey: 'gemuese_huelsenfruechte', name: 'Linsen' },
    detail: { groupKey: 'getreide', name: 'Nudeln' },
    due: 'Thunfisch (Konserve)',
  },
}

function picksFor(projectName: string): Picks {
  const picks = PICKS[projectName]
  // test.skip wirft selbst, das throw danach braucht nur TypeScript
  if (picks === undefined) {
    test.skip(true, 'Ändert Daten, läuft nur auf iPhone und Desktop')
    throw new Error('übersprungen')
  }
  return picks
}

async function packagesOf(locator: Locator): Promise<number> {
  const match = /(\d+) Packung/.exec(await locator.innerText())
  return Number(match?.[1])
}

// Zeile „Nudeln 3 Packungen …“, nicht der Sprungchip „Nudeln, Reis und Getreide“
const rowName = (name: string) => new RegExp(`^${name}\\s+\\d`)

test('„−1“ in der Zeile nimmt eine Packung, Rückgängig holt sie zurück', async ({ page }, info) => {
  const { list } = picksFor(info.project.name)
  await page.goto(`/vorrat/${list.groupKey}`)
  const row = page.getByRole('link', { name: rowName(list.name) })
  const before = await packagesOf(row)

  const takeOne = page.getByRole('button', { name: `1 Packung ${list.name} entnehmen` })
  // Per Tastatur: Der Fokus bleibt auf dem Knopf, statt auf body zu fallen (#218)
  await takeOne.focus()
  await takeOne.press('Enter')

  const bar = noticeBar(page, `${list.name}: 1 Packung verbraucht`)
  await expectNotice(page, `${list.name}: 1 Packung verbraucht`)
  await expect(row).toContainText(`${String(before - 1)} Packung`)
  await expect(takeOne).toBeFocused()
  await expectAccessibleLayout(page)

  // Rückgängig per Tastatur: Die Zeile geht, der Fokus zurück auf „−1“ (#269)
  await bar.getByRole('button', { name: 'Rückgängig' }).press('Enter')

  await expect(bar).toHaveCount(0)
  await expect(row).toContainText(`${String(before)} Packung`)
  await expect(takeOne).toBeFocused()
})

const FIFO_LIST = 'data-e2e-fifo-list'

// Die Datumszeile, aus der „1 entnehmen“ nimmt („23.01.2027 bald · als Nächstes dran 1×“), in
// der Liste ihres Produkts. Nicht die Summe der Art: Andere Tests erfassen parallel Nudeln, die
// Summe ändert sich dann mitten im Test (#272). Die Liste wird markiert: React behält das Element
// (Schlüssel je Produkt) auch dann, wenn beim Neuladen ein neues Produkt davor erscheint.
async function fifoDateRow(page: Page, date: string): Promise<Locator> {
  const fifoRow = page.getByRole('button', { name: /als Nächstes dran/ })
  await page
    .getByRole('list')
    .filter({ has: fifoRow })
    .evaluate((list, attribute) => {
      list.setAttribute(attribute, '')
    }, FIFO_LIST)
  return page
    .locator(`ul[${FIFO_LIST}]`)
    .getByRole('button', { name: new RegExp(`^${RegExp.escape(date)}\\s`) })
}

// allInnerTexts wartet nicht: Verschwindet die Zeile zwischen Zählen und Lesen, hinge innerText
async function unitsOn(row: Locator): Promise<number> {
  const [text] = await row.allInnerTexts()
  return text === undefined ? 0 : Number(/(\d+)×/.exec(text)?.[1])
}

test('„1 entnehmen“ im Detail nimmt das früheste MHD', async ({ page }, info) => {
  const { detail } = picksFor(info.project.name)
  await page.goto(`/vorrat/${detail.groupKey}`)
  await page.getByRole('link', { name: rowName(detail.name) }).click()
  await expect(page.getByRole('heading', { level: 1, name: detail.name })).toBeVisible()
  const take = page.getByRole('button', { name: /^1 entnehmen · / })
  const date = (await take.innerText()).replace('1 entnehmen · ', '')
  const row = await fifoDateRow(page, date)
  const before = await unitsOn(row)

  await take.click()

  const bar = noticeBar(page, `${detail.name}: 1 Packung verbraucht (${date})`)
  await expectNotice(page, `${detail.name}: 1 Packung verbraucht (${date})`)
  await expect.poll(() => unitsOn(row)).toBe(before - 1)

  await bar.getByRole('button', { name: 'Rückgängig' }).click()

  await expect(bar).toHaveCount(0)
  await expect.poll(() => unitsOn(row)).toBe(before)
})

test('„Verbraucht“ auf Bald fällig, mit Hinweis zum MHD', async ({ page }, info) => {
  const { due } = picksFor(info.project.name)
  await page.goto('/uebersicht/bald-faellig')
  await expect(page.getByRole('heading', { level: 1, name: 'Bald fällig' })).toBeVisible()
  await expect(
    page.getByText('MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.'),
  ).toBeVisible()
  const button = page.getByRole('button', { name: `1 Packung ${due} verbraucht` })
  await expect(button).toBeVisible()

  await button.click()

  const bar = noticeBar(page, `${due}: 1 Packung verbraucht`)
  await expectNotice(page, `${due}: 1 Packung verbraucht`)
  await expect(button).toHaveCount(0)

  await bar.getByRole('button', { name: 'Rückgängig' }).click()

  await expect(button).toBeVisible()
})
