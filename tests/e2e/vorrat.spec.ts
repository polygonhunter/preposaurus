import { expect, test } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Vorrat lesen mit dem Beispielhaushalt (npm run e2e:db, db/seeds/demo-data.ts). Diese Tests
// ändern nichts, Entnehmen steht in vorrat-entnehmen.spec.ts.

const GRAIN = 'Getreide, Getreideprodukte, Brot und Kartoffeln'

test('Drilldown: Warengruppe, Lebensmittelarten nach Kategorie, Detail', async ({ page }) => {
  await page.goto('/vorrat')
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()
  // Leere Warengruppen bleiben stehen, denn die Lücke ist eine Information
  await expect(page.getByRole('link', { name: /^Fette und Öle\s*noch nichts/ })).toBeVisible()

  await page.getByRole('link', { name: new RegExp(`^${GRAIN}`) }).click()

  await expect(page).toHaveURL(/\/vorrat\/getreide$/)
  await expect(page.getByRole('heading', { level: 1, name: GRAIN })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Zu Kategorie springen' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Müsli, Flocken und Cerealien' }),
  ).toBeVisible()
  await expectAccessibleLayout(page)

  await page.getByRole('link', { name: /^Haferflocken/ }).click()

  await expect(page).toHaveURL(/\/vorrat\/art\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Haferflocken' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pfad' })).toContainText(GRAIN)
  await expect(page.getByRole('heading', { name: 'Haltbarkeit' })).toBeVisible()
  // Eine Packung ohne Datum steht zuletzt, „1 entnehmen“ nimmt die mit Datum
  await expect(page.getByRole('button', { name: /Datum fehlt/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^1 entnehmen · \d{2}\.\d{2}\.\d{4}$/ }),
  ).toBeVisible()
  // Der feste Knopf „1 entnehmen“ verdeckt beim Scrollen Zeilen (auf dem Duo außen auch beim
  // Laden). Am Seitenende steht er an seinem Platz, dann prüft axe die Trefferflächen ohne Überdeckung.
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await expectAccessibleLayout(page)
})

test('Suche zeigt eine flache Trefferliste und sagt, wenn nichts passt', async ({ page }) => {
  await page.goto('/vorrat')
  const search = page.getByRole('searchbox', { name: 'Vorrat durchsuchen' })

  await search.fill('lins')
  await search.press('Enter')

  await expect(page).toHaveURL(/suche=lins/)
  await expect(page.getByRole('link', { name: /^Linsen/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Haferflocken/ })).toHaveCount(0)
  await expectAccessibleLayout(page)

  await page.goto('/vorrat?suche=quark')

  await expect(page.getByText('Nichts gefunden für „quark“.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Filter zurücksetzen' })).toHaveAttribute(
    'href',
    '/vorrat',
  )
})

test('Zustand „Bald fällig“ und Filter-Blatt stehen in der Adresse', async ({ page }) => {
  await page.goto('/vorrat')

  await page
    .getByRole('group', { name: 'Zustand' })
    .getByRole('link', { name: 'Bald fällig' })
    .click()

  await expect(page).toHaveURL(/zustand=bald-faellig/)
  await expect(
    page.getByRole('group', { name: 'Zustand' }).getByRole('link', { name: /^Bald fällig \d+$/ }),
  ).toHaveAttribute('aria-current', 'true')

  await page.goto('/vorrat')
  await page.getByRole('button', { name: 'Filter' }).click()
  const sheet = page.getByRole('dialog', { name: 'Filter' })
  await expect(sheet).toBeVisible()
  await expectAccessibleLayout(page)
  await sheet.getByRole('group', { name: 'Lagerort' }).getByLabel('Küche').check()
  await sheet.getByRole('button', { name: 'Anzeigen' }).click()

  await expect(page).toHaveURL(/lagerort=[0-9a-f-]{36}/)
  await expect(page.getByRole('link', { name: /^Haferflocken/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Linsen/ })).toHaveCount(0)

  await page.getByRole('link', { name: 'Filter Küche entfernen' }).click()

  await expect(page).toHaveURL(/\/vorrat$/)
})

test('unbekannte Lebensmittelart zeigt „Nicht gefunden“', async ({ page }) => {
  await page.goto('/vorrat/art/00000000-0000-4000-8000-000000000000')

  await expect(page.getByRole('heading', { level: 1, name: 'Nicht gefunden' })).toBeVisible()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Vorrat und Bald fällig sind barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const path of ['/vorrat', '/vorrat?zustand=abgelaufen', '/uebersicht/bald-faellig']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectAccessibleLayout(page)
    }
  })
}
