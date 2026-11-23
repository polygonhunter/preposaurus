import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
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

const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })

test('„−1“ in der Zeile nimmt eine Packung, Rückgängig holt sie zurück', async ({ page }, info) => {
  const { list } = picksFor(info.project.name)
  await page.goto(`/vorrat/${list.groupKey}`)
  const row = page.getByRole('link', { name: rowName(list.name) })
  const before = await packagesOf(row)

  await page.getByRole('button', { name: `1 Packung ${list.name} entnehmen` }).click()

  const bar = undoBar(page, `${list.name}: 1 Packung verbraucht`)
  await expect(bar).toBeVisible()
  await expect(row).toContainText(`${String(before - 1)} Packung`)
  await expectAccessibleLayout(page)

  await bar.getByRole('button', { name: 'Rückgängig' }).click()

  await expect(bar).toHaveCount(0)
  await expect(row).toContainText(`${String(before)} Packung`)
})

test('„1 entnehmen“ im Detail nimmt das früheste MHD', async ({ page }, info) => {
  const { detail } = picksFor(info.project.name)
  await page.goto(`/vorrat/${detail.groupKey}`)
  await page.getByRole('link', { name: rowName(detail.name) }).click()
  await expect(page.getByRole('heading', { level: 1, name: detail.name })).toBeVisible()
  const packages = page.locator('dd').first()
  const before = Number(await packages.innerText())
  const take = page.getByRole('button', { name: /^1 entnehmen · / })
  const date = (await take.innerText()).replace('1 entnehmen · ', '')

  await take.click()

  const bar = undoBar(page, `${detail.name}: 1 Packung verbraucht (${date})`)
  await expect(bar).toBeVisible()
  await expect(packages).toHaveText(String(before - 1))

  await bar.getByRole('button', { name: 'Rückgängig' }).click()

  await expect(packages).toHaveText(String(before))
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

  const bar = undoBar(page, `${due}: 1 Packung verbraucht`)
  await expect(bar).toBeVisible()
  await expect(button).toHaveCount(0)

  await bar.getByRole('button', { name: 'Rückgängig' }).click()

  await expect(button).toBeVisible()
})
