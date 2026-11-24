import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Absende-Knöpfe (DESIGN_SYSTEM §7, #287): Jedes Formular hat unten genau einen breiten
// `primary`-Knopf, so breit wie das Formular, höchstens 768 px (Lesespalte, #288). Er ist der erste
// Absende-Knopf, damit Enter ihn auslöst. Geprüft je Stufe, hell und dunkel. Ändert nichts, bis auf
// den Test mit dem Blatt (nur Desktop, räumt selbst auf).

const READING_COLUMN_PX = 768
const PRIMARY_HEIGHT_PX = 50

// Seite und die Knöpfe, die dort mindestens stehen (manche Formulare zeigt die Seite nur unter
// Bedingungen, z. B. Check-in nur mit Mailversand)
const FORM_PAGES: readonly (readonly [path: string, labels: readonly string[]])[] = [
  ['/einstellungen/regeln', ['Speichern', 'Speichern']],
  ['/einstellungen/erinnerungen', ['Speichern']],
  ['/einstellungen/lebensmittelarten/neu', ['Anlegen']],
  ['/einstellungen/kategorien/neu', ['Anlegen']],
  ['/einstellungen/lagerorte', ['Hinzufügen']],
  ['/einstellungen/mitglieder', ['Speichern']],
  ['/einstellungen/konto', ['Speichern', 'Passwort ändern', 'Speichern']],
  ['/einstellungen/foto-erkennung', ['Speichern', 'Hinzufügen']],
  ['/nachkaufen', ['Hinzufügen']],
  ['/einstellungen/ziel', ['Speichern']],
  ['/einstellungen/mitglieder/neu', ['Speichern']],
  ['/einstellungen/nutzer/neu', ['Anlegen']],
]

type SubmitMeasure = Readonly<{
  label: string
  width: number
  height: number
  available: number
  isFirstSubmit: boolean
  fieldsBelow: readonly string[]
}>

// Misst jeden sichtbaren Absende-Block im Bereich: Knopf, verfügbare Breite im Formular (ohne
// dessen Innenabstand und den Rand des Blocks) und welche Felder nicht darüber stehen.
function measureSubmits(scope: Locator): Promise<SubmitMeasure[]> {
  return scope.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>('[data-form-submit]')]
      .filter((block) => block.getClientRects().length > 0)
      .map((block) => {
        const form = block.closest('form')
        const button = block.querySelector('button[type="submit"]')
        if (form === null || button === null) throw new Error('Absende-Block ohne Formular')
        const formStyle = getComputedStyle(form)
        const blockStyle = getComputedStyle(block)
        const px = (value: string) => Number.parseFloat(value) || 0
        const box = button.getBoundingClientRect()
        // Eingeklappte Bereiche (<details>) zählen nicht, ihr Inhalt steht nicht auf der Seite
        const fields = [
          ...form.querySelectorAll('input:not([type="hidden"]), textarea, select, fieldset'),
        ].filter((field) => field.checkVisibility() && field.getBoundingClientRect().width > 0)
        return {
          label: button.textContent.trim(),
          width: box.width,
          height: box.height,
          available:
            form.clientWidth -
            px(formStyle.paddingLeft) -
            px(formStyle.paddingRight) -
            px(blockStyle.marginLeft) -
            px(blockStyle.marginRight),
          isFirstSubmit: form.querySelector('button[type="submit"]') === button,
          fieldsBelow: fields
            .filter((field) => field.getBoundingClientRect().bottom > box.top)
            .map((field) => `${field.tagName} ${field.getAttribute('name') ?? ''}`),
        }
      }),
  )
}

function expectWidePrimary(measures: readonly SubmitMeasure[]): void {
  for (const measure of measures) {
    const expected = Math.min(measure.available, READING_COLUMN_PX)
    // clientWidth rundet auf ganze Pixel, der Knopf misst auch halbe (Duo quer)
    expect(
      Math.abs(measure.width - expected),
      `„${measure.label}“ so breit wie das Formular`,
    ).toBeLessThanOrEqual(1)
    expect(measure.height, `„${measure.label}“ ist primary`).toBeCloseTo(PRIMARY_HEIGHT_PX, 0)
    expect(measure.isFirstSubmit, `„${measure.label}“ löst Enter aus`).toBe(true)
    expect(measure.fieldsBelow, `„${measure.label}“ steht unter den Feldern`).toEqual([])
  }
}

async function openFormPage(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await waitForHydration(page)
}

// Farbschema vor dem Laden: Ein Wechsel auf offener Seite startet Übergänge, auf die axe wartet
for (const [path, labels] of FORM_PAGES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path}: breiter primary-Knopf unten, barrierefrei (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await openFormPage(page, path)
      const measures = await measureSubmits(page.locator('main'))
      expect(measures.map(({ label }) => label)).toEqual(expect.arrayContaining([...labels]))
      expect(measures.length).toBeGreaterThanOrEqual(labels.length)
      expectWidePrimary(measures)
      await expectAccessibleLayout(page)
    })
  }
}

test('weit über 1000 px: der Knopf bleibt in der Lesespalte', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Nur am PC gibt es so breite Fenster')
  await page.setViewportSize({ width: 1920, height: 1080 })
  for (const path of ['/nachkaufen', '/einstellungen/konto']) {
    await openFormPage(page, path)
    const measures = await measureSubmits(page.locator('main'))
    expect(measures.length).toBeGreaterThan(0)
    expectWidePrimary(measures)
    for (const { width } of measures) expect(width).toBeLessThanOrEqual(READING_COLUMN_PX)
  }
})

test('im Blatt gilt dieselbe Regel', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Legt einen Lagerort an, läuft nur auf Desktop')
  const name = 'Knopfprobe'
  await openFormPage(page, '/einstellungen/lagerorte')
  const link = page.getByRole('link', { name: new RegExp(name) })
  // Ein abgebrochener erster Versuch lässt den Ort stehen, dann geht es mit ihm weiter
  if ((await link.count()) === 0) {
    await page.getByLabel('Name, z. B. Keller oder Vorratsschrank').fill(name)
    await page.getByRole('button', { name: 'Hinzufügen' }).click()
    await expect(page.getByText(`„${name}“ ist angelegt.`)).toBeVisible()
  }

  await link.click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await page.getByRole('button', { name: 'Lagerort löschen' }).click()
  const sheet = page.getByRole('dialog', { name: `„${name}“ löschen?` })
  await expect(sheet).toBeVisible()
  const measures = await measureSubmits(sheet)
  expect(measures.map(({ label }) => label)).toEqual(['Löschen'])
  expectWidePrimary(measures)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }

  await sheet.getByRole('button', { name: 'Löschen' }).click()
  await expect(page).toHaveURL(/\/einstellungen\/lagerorte$/)
})
