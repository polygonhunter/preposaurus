import type { Page } from '@playwright/test'
import { E2E_ADMIN } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Verlauf als Unterseite des Vorrats (#48, UX-Konzept D7) je Stufe. Der Beispielvorrat bringt je
// eine verbrauchte und eine entsorgte Packung Nudeln vom Tag des Setups mit, eingetragen vom Admin.
// Diese Tests ändern nichts; dass neue Entnahmen erscheinen, prüft vorrat-entsorgt.spec.ts.

const BREIT = 900
const WEIT = 1280
const ADMIN = E2E_ADMIN.displayName

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const title = (page: Page, name: string) => page.getByRole('heading', { level: 1, name })
const historyTable = (page: Page) => page.getByRole('table', { name: 'Verlauf' })

/** Eintrag als Zeile der Liste bzw. ab „weit“ als Zeile der Tabelle. */
function entry(page: Page, outcome: 'Verbraucht' | 'Entsorgt') {
  if (widthOf(page) >= WEIT) {
    return historyTable(page).getByRole('row', { name: new RegExp(`^Nudeln ${outcome} ${ADMIN}`) })
  }
  return page.getByRole('link', { name: new RegExp(`^Nudeln\\s*${outcome} · ${ADMIN}`) })
}

/** Detail der Nudeln über Ebene 2; die Sprungchips der Kategorien sind auch Links. */
async function openNoodles(page: Page) {
  await page.goto('/vorrat/getreide')
  await page
    .getByRole('listitem')
    .getByRole('link', { name: /^Nudeln/ })
    .first()
    .click()
  await expect(title(page, 'Nudeln')).toBeVisible()
}

async function openHistory(page: Page) {
  await page.goto('/vorrat')
  await page.getByRole('link', { name: 'Verlauf', exact: true }).click()
  await expect(page).toHaveURL(/\/vorrat\/verlauf$/)
  await expect(title(page, 'Verlauf')).toBeVisible()
}

test('Verlauf zeigt Verbraucht und Entsorgt mit Person, Filter in der Adresse', async ({
  page,
}) => {
  await openHistory(page)
  await expect(entry(page, 'Verbraucht').first()).toBeVisible()
  await expect(entry(page, 'Entsorgt').first()).toBeVisible()
  await expect(page.getByRole('group', { name: 'Zeitraum' })).toContainText('30 Tage')

  await page
    .getByRole('group', { name: 'Ausgang' })
    .getByRole('link', { name: /^Entsorgt/ })
    .click()
  await expect(page).toHaveURL(/ausgang=entsorgt/)
  await expect(entry(page, 'Entsorgt').first()).toBeVisible()
  await expect(entry(page, 'Verbraucht')).toHaveCount(0)

  await page.getByRole('group', { name: 'Zeitraum' }).getByRole('link', { name: 'Alles' }).click()
  await expect(page).toHaveURL(/ausgang=entsorgt&zeitraum=alles/)
  await expect(page.getByText('Alles, was ihr verbraucht oder entsorgt habt.')).toBeVisible()
  await expect(entry(page, 'Entsorgt').first()).toBeVisible()
})

test('Aus dem Detail öffnet „Alle“ den Verlauf der Lebensmittelart', async ({ page }) => {
  await openNoodles(page)

  await page.getByRole('link', { name: 'Alle Einträge im Verlauf ansehen' }).click()
  await expect(page).toHaveURL(/\/vorrat\/verlauf\?art=[0-9a-f-]+&zeitraum=alles$/)
  const onlyNoodles = page.getByRole('link', { name: 'Nur Nudeln, Filter entfernen' })
  await expect(onlyNoodles).toBeVisible()
  await expect(entry(page, 'Verbraucht').first()).toBeVisible()

  await onlyNoodles.click()
  await expect(page).toHaveURL(/\/vorrat\/verlauf\?zeitraum=alles$/)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Verlauf ist in jeder Stufe barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/vorrat/verlauf')
    await expect(entry(page, 'Verbraucht').first()).toBeVisible()
    await expectAccessibleLayout(page)

    await page.goto('/vorrat/verlauf?zeitraum=alles&ausgang=verbraucht')
    await expect(entry(page, 'Verbraucht').first()).toBeVisible()
    await expectAccessibleLayout(page)
  })
}

test.describe('bis „weit“', () => {
  test('Verlauf ist eine Liste je Tag, die Tabelle fehlt', async ({ page }) => {
    test.skip(widthOf(page) >= WEIT, 'Ab 1280 px steht die Tabelle')
    await page.goto('/vorrat/verlauf')

    await expect(entry(page, 'Verbraucht').first()).toBeVisible()
    await expect(historyTable(page)).toBeHidden()
  })
})

test.describe('ab „breit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < BREIT, 'Liste und Detail nebeneinander erst ab 900 px')
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Detail mit Verlauf neben der Liste ist barrierefrei (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await openNoodles(page)
      await expect(page.getByRole('region', { name: 'Vorrat' })).toBeVisible()
      await expect(page.getByRole('list', { name: 'Verlauf' })).toBeVisible()

      await expectAccessibleLayout(page)
    })
  }
})

test.describe('ab „weit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < WEIT, 'Tabelle erst ab 1280 px')
  })

  test('Verlauf ist eine Tabelle mit Tagen als Zwischenzeile', async ({ page }) => {
    await page.goto('/vorrat/verlauf')
    const table = historyTable(page)

    await expect(table.getByRole('columnheader')).toHaveText([
      'Lebensmittel',
      'Ausgang',
      'Von',
      'MHD',
    ])
    await expect(
      table.getByRole('rowheader', { name: /, \d{2}\.\d{2}\.\d{4}$/ }).first(),
    ).toBeVisible()
    await expect(entry(page, 'Entsorgt').first()).toBeVisible()

    await table.getByRole('link', { name: 'Nudeln' }).first().click()
    await expect(title(page, 'Nudeln')).toBeVisible()
  })
})
