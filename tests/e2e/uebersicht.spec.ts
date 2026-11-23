import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Übersicht (#67 bis #70) mit dem Beispielvorrat (tests/e2e/beispielvorrat.setup.ts): 3 Personen,
// Quelle BBK/BLE aus dem Seed (#20), Ziel 10 Tage in 40 Tagen. Die MHDs stehen relativ zum Tag des
// Seeds, und vorrat-entnehmen.spec.ts entnimmt parallel. Deshalb prüfen die Tests Aufbau, keine
// Zählerstände.
// Die leere Übersicht prüft einrichtung.setup.ts direkt nach der Einrichtung.

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
  await expect(today.getByText(/begrenzt euren Vorrat|reichen gleich lang/)).toBeVisible()

  await expect(
    page.getByRole('link', { name: /^(Am|Ziel erreicht: am) \d{2}\.\d{2}\.\d{4}/ }),
  ).toHaveAttribute('href', '/uebersicht/bald-faellig')
  await expect(page.getByRole('link', { name: /bringen euch|fehlen noch/ })).toHaveAttribute(
    'href',
    '/nachkaufen',
  )
})

test('zeigt Bald fällig ohne Unterseite und führt mit „Alle N“ dorthin', async ({ page }) => {
  await page.goto('/uebersicht')
  const due = dueSection(page)

  await expect(due.getByRole('term')).toHaveText([
    'abgelaufen',
    'diese Woche',
    'diesen Monat',
    'in 3 Monaten',
  ])
  await expect(due.getByRole('listitem').first()).toContainText(/abgelaufen|dringend|bald fällig/)
  expect(await due.getByRole('listitem').count()).toBeLessThanOrEqual(3)

  await due.getByRole('link', { name: /^Alle \d+ fälligen Packungen ansehen$/ }).click()
  await expect(page).toHaveURL(/\/uebersicht\/bald-faellig$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Bald fällig' })).toBeVisible()
})

test('zeigt Warengruppen ohne Wasser und führt in den Vorrat der Gruppe', async ({ page }) => {
  await page.goto('/uebersicht')
  const groups = page.getByRole('list', { name: 'Warengruppen' })

  await expect(groups.getByRole('meter', { name: 'Wasser' })).toHaveCount(0)
  await expect(groups.getByText('am knappsten')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /auf der Liste|unter dem Ziel/ })).toHaveAttribute(
    'href',
    '/nachkaufen',
  )
  // Die Einstellungen-Tests legen parallel kurz eine Person an, deshalb ohne feste Zahl
  await expect(
    page.getByRole('link', { name: /^\d+ Personen · Ziel 10 Tage bis/ }),
  ).toHaveAttribute('href', '/einstellungen')
  // Die Quelle ist noch nicht vom Maintainer geprüft und sagt das dezent (#20)
  await expect(
    page.getByText('BBK/BLE, Stand BBK 11/2025, BLE 2024 · Werte noch nicht geprüft'),
  ).toBeVisible()

  // Kurzname in Zeile und Titel, der amtliche Name steht über dem Titel (#177)
  await groups.getByRole('link', { name: /^Getreide und Kartoffeln/ }).click()
  await expect(page).toHaveURL(/\/vorrat\/getreide$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Getreide und Kartoffeln' }),
  ).toBeVisible()
  await expect(page.getByText('Getreide, Getreideprodukte, Brot und Kartoffeln')).toBeVisible()
})

const explainSheet = (page: Page) => page.getByRole('dialog', { name: 'So wird gerechnet' })

test('Erklär-Blatt öffnet per Tastatur und nennt Rechnung, „ca.“ und Quelle', async ({ page }) => {
  await page.goto('/uebersicht')
  const trigger = page.getByRole('button', { name: 'So wird gerechnet' })

  const sheet = explainSheet(page)
  // Erst nach der Hydrierung reagiert der Knopf, deshalb mit Wiederholung
  await expect(async () => {
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(sheet).toBeVisible({ timeout: 1000 })
  }).toPass()
  await expect(sheet.getByText(/^\d+ \S+: je [\d.]+ kcal und /).first()).toBeVisible()
  await expect(sheet.getByText(/^[\d.]+ kcal ÷ [\d.]+ kcal am Tag = [\d,]+ Tage?$/)).toBeVisible()
  await expect(sheet.getByText(/^[\d,.]+ l ÷ [\d,]+ l am Tag = [\d,]+ Tage?$/)).toBeVisible()
  await expect(
    sheet.getByText(/^Es zählt der kleinere Wert|^Essen und Wasser reichen/),
  ).toBeVisible()
  await expect(sheet.getByRole('heading', { name: 'Was „ca.“ bedeutet' })).toBeVisible()
  await expect(sheet.getByRole('heading', { name: 'Was nicht mitzählt' })).toBeVisible()
  await expect(sheet.getByRole('link', { name: 'Zur Quelle' })).toHaveAttribute('href', /^https:/)
  await expect(sheet.getByText('Werte noch nicht geprüft')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test('Erklär-Blatt öffnet beim Tippen auf Kernzahl und Balken', async ({ page }) => {
  await page.goto('/uebersicht')
  const today = page.getByRole('region', { name: 'Euer Vorrat reicht für' })
  const sheet = explainSheet(page)
  // Die Fläche des Knopfs liegt über dem ganzen Kopf, deshalb ein echter Tipp an die Stelle
  const tapOn = async (target: ReturnType<Page['getByText']>) => {
    const box = await target.boundingBox()
    if (box === null) throw new Error('nicht sichtbar')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  }

  // Erst nach der Hydrierung reagiert der Knopf, deshalb mit Wiederholung
  const openBy = async (target: ReturnType<Page['getByText']>) => {
    await expect(async () => {
      await tapOn(target)
      await expect(sheet).toBeVisible({ timeout: 1000 })
    }).toPass()
  }

  await openBy(today.getByText(/^\d+$/))
  await sheet.getByRole('button', { name: 'Schließen' }).click()
  await expect(sheet).toBeHidden()

  await openBy(today.getByRole('meter', { name: 'Wasser' }))
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Erklär-Blatt ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/uebersicht')
    await expect(async () => {
      await page.getByRole('button', { name: 'So wird gerechnet' }).click()
      await expect(explainSheet(page)).toBeVisible({ timeout: 1000 })
    }).toPass()

    await expectAccessibleLayout(page)
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Übersicht mit Vorrat ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/uebersicht')
    await expect(dueSection(page)).toBeVisible()

    await expectAccessibleLayout(page)
  })
}
