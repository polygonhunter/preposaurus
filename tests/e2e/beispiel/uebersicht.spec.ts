import { expect, test, type Page } from '@playwright/test'
import { E2E_EMPTY_ADMIN } from '../../helpers/e2e-demo-users'
import { expectAccessibleLayout } from '../../helpers/page-checks'

// Übersicht (#67 bis #70) mit dem Beispielhaushalt aus db/seeds/demo-data.ts: 3 Personen, Ziel
// 10 Tage in 40 Tagen, erfundene Quelle. Die MHDs stehen relativ zum Tag des Seeds, deshalb prüfen
// die Tests Aufbau und Zähler, keine Tageswerte.

const dueSection = (page: Page) => page.getByRole('region', { name: 'Bald fällig' })

test('zeigt „Heute versorgt“ mit Essen, Wasser, Ziel und nächstem Schritt', async ({ page }) => {
  await page.goto('/uebersicht')

  const today = page.getByRole('region', { name: 'Euer Vorrat reicht für' })
  await expect(today.getByText(/^\d+$/)).toBeVisible()
  await expect(today.getByRole('meter', { name: 'Essen' })).toHaveAttribute(
    'aria-valuetext',
    /Tage?, Ziel 10 Tage$/,
  )
  await expect(today.getByRole('meter', { name: 'Wasser' })).toBeVisible()
  await expect(today.getByText(/begrenzt euren Vorrat/)).toBeVisible()

  await expect(
    page.getByRole('link', { name: /^Am \d{2}\.\d{2}\.\d{4} wären es \d+ von 10 Tagen/ }),
  ).toHaveAttribute('href', '/uebersicht/bald-faellig')
  await expect(page.getByRole('link', { name: /bringen euch|fehlen noch/ })).toHaveAttribute(
    'href',
    '/nachkaufen',
  )
  await expect(page.getByRole('link', { name: 'Einstellungen' }).first()).toBeVisible()
})

test('zeigt Bald fällig ohne Unterseite: Zähler, drei Einträge, „Alle 7“', async ({ page }) => {
  await page.goto('/uebersicht')
  const due = dueSection(page)

  // Demo: 2 abgelaufen, 2 in 10 Tagen, 3 in 60 Tagen (AMPEL_OFFSETS in db/seeds/factories.ts)
  await expect(due.getByRole('term')).toHaveText([
    'abgelaufen',
    'diese Woche',
    'diesen Monat',
    'in 3 Monaten',
  ])
  await expect(due.getByRole('definition')).toHaveText(['2', '0', '2', '3'])
  await expect(due.getByRole('listitem')).toHaveCount(3)
  await expect(due.getByRole('listitem').first()).toContainText('abgelaufen')

  await due.getByRole('link', { name: 'Alle 7 fälligen Packungen ansehen' }).click()
  await expect(page).toHaveURL(/\/uebersicht\/bald-faellig$/)
})

test('zeigt Warengruppen ohne Wasser, die knappste mit Wort, Tippen führt in den Vorrat', async ({
  page,
}) => {
  await page.goto('/uebersicht')
  const groups = page.getByRole('list', { name: 'Warengruppen' })

  await expect(groups.getByRole('meter', { name: 'Wasser' })).toHaveCount(0)
  await expect(groups.getByText('am knappsten')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Warengruppen? unter dem Ziel/ })).toHaveAttribute(
    'href',
    '/nachkaufen',
  )
  await expect(page.getByRole('link', { name: /^3 Personen · Ziel 10 Tage bis/ })).toHaveAttribute(
    'href',
    '/einstellungen',
  )

  await groups
    .getByRole('link', { name: /^Getreide, Getreideprodukte, Brot und Kartoffeln/ })
    .click()
  await expect(page).toHaveURL(/\/vorrat\/getreide$/)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Übersicht mit Vorrat ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/uebersicht')
    await expect(dueSection(page)).toBeVisible()

    await expectAccessibleLayout(page)
  })
}

test.describe('Haushalt ohne Vorrat und ohne Mitglieder', () => {
  test.use({ storageState: E2E_EMPTY_ADMIN.storageState })

  test('zeigt einen Satz und eine Handlung', async ({ page }) => {
    await page.goto('/uebersicht')

    await expect(page.getByText('Noch nichts im Vorrat.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Erstes Produkt erfassen' })).toHaveAttribute(
      'href',
      '/neu',
    )
    await expect(dueSection(page)).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: /^Noch niemand eingetragen · Ziel 10 Tage/ }),
    ).toHaveAttribute('href', '/einstellungen')
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`leere Übersicht ist barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/uebersicht')
      await expect(page.getByRole('link', { name: 'Erstes Produkt erfassen' })).toBeVisible()

      await expectAccessibleLayout(page)
    })
  }
})
