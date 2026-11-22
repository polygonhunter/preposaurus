// Manuelles Erfassen (#52, #53, #54): neues Produkt mit zwei Daten und „Datum fehlt“, Fehler am
// Feld, Tastatur, doppeltes Speichern und das Wiedererkennen danach. Alle Projekte teilen sich eine
// Datenbank, deshalb nutzt jedes Projekt einen eigenen Inhalt (z. B. 412 g) und erkennt nur sein
// eigenes Produkt wieder.
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const PROJECTS = ['iphone', 'duo-aussen', 'duo-hoch', 'duo-quer', 'desktop']

/** Eigener Inhalt je Projekt und Test, damit parallele Läufe sich nicht wiedererkennen */
function contentFor(testInfo: TestInfo, offset: number): string {
  const index = Math.max(PROJECTS.indexOf(testInfo.project.name), 0)
  return `${String(400 + offset + index)} g`
}

const form = (page: Page) => page.getByRole('form', { name: 'Produkt erfassen' })
const search = (page: Page) => page.getByRole('searchbox', { name: 'Lebensmittelart suchen' })
const content = (page: Page) => page.getByLabel('Inhalt je Packung')
const bestBefore = (page: Page) => page.getByLabel('Mindestens haltbar bis')

async function chooseNoodles(page: Page) {
  await search(page).fill('nudel')
  await page.getByRole('button', { name: /^Nudeln\s*Getreide/ }).click()
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
}

async function addDate(page: Page, text: string) {
  await bestBefore(page).fill(text)
  await bestBefore(page).press('Enter')
}

test('Erfassen öffnet das Formular, die Lebensmittelart hat sofort den Fokus', async ({ page }) => {
  await page.goto('/neu')

  await expect(page).toHaveURL(/\/neu\/manuell$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Erfassen' })).toBeVisible()
  await expect(search(page)).toBeFocused()
  await expectAccessibleLayout(page)
})

test('Fehler stehen am Feld, der Fokus springt zum ersten', async ({ page }) => {
  await page.goto('/neu/manuell')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(search(page)).toHaveAccessibleDescription('Bitte wähle eine Lebensmittelart.')
  await expect(search(page)).toBeFocused()
  await expect(content(page)).toHaveAccessibleDescription(
    /Bitte gib den Inhalt einer Packung an, z\. B\. 500 g\./,
  )
  await expect(bestBefore(page)).toHaveAccessibleDescription(/Bitte gib ein MHD ein oder wähle/)
  await expectAccessibleLayout(page)

  await content(page).fill('6 Stück')
  await addDate(page, '09/27')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(content(page)).toHaveAccessibleDescription(/Stück zählt als Anzahl der Packungen/)
  await expect(bestBefore(page)).toHaveAccessibleDescription(/Jahr vierstellig/)
  await expect(content(page)).toHaveAttribute('aria-invalid', 'true')
})

test('neues Produkt mit zwei Daten und „Datum fehlt“, doppeltes Speichern legt nichts doppelt an', async ({
  page,
}, testInfo) => {
  const amount = contentFor(testInfo, 10)
  await page.goto('/neu/manuell')
  await chooseNoodles(page)
  await content(page).fill(amount)
  await page.getByRole('button', { name: 'Packung', exact: true }).click()
  await addDate(page, '09/2027')
  await addDate(page, '2028')
  await addDate(page, '9/2027')
  await page.getByRole('button', { name: 'Datum fehlt' }).click()

  const dates = form(page).getByRole('list', { name: 'MHD und Anzahl' })
  await expect(dates.getByRole('listitem')).toHaveText([
    /09\/2027.*2×/,
    /2028.*1×/,
    /Datum fehlt.*1×/,
  ])
  const summary = form(page).getByRole('list', { name: 'Zusammenfassung' })
  await expect(summary).toContainText(`4 × Nudeln ${amount}`)
  await expect(summary).toContainText(/ca\. [\d.]+ kcal/)
  await expect(summary).toContainText('09/2027 (2×), 2028 (1×), Datum fehlt (1×)')
  await expectAccessibleLayout(page)

  // Zwei Absende-Ereignisse direkt hintereinander, wie ein doppeltes Tippen
  await form(page).evaluate((element: HTMLFormElement) => {
    element.requestSubmit()
    element.requestSubmit()
  })

  await expect(page.getByRole('heading', { name: 'Gespeichert' })).toBeFocused()
  await expect(page.getByText('4 Packungen Nudeln sind jetzt im Vorrat.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Zum Vorrat' })).toBeVisible()
  await expectAccessibleLayout(page)

  await page.getByRole('button', { name: 'Noch eins erfassen' }).click()
  await expect(search(page)).toBeFocused()
  await page
    .getByRole('group', { name: 'Zuletzt genutzt' })
    .getByRole('button', { name: 'Nudeln' })
    .click()
  await content(page).fill(amount)
  await page.getByRole('button', { name: 'Packung', exact: true }).click()

  // Genau ein Angebot: Das Produkt entstand trotz doppeltem Absenden nur einmal.
  const offers = page.getByRole('button', { name: `Zu Nudeln ${amount} hinzufügen` })
  await expect(offers).toHaveCount(1)
  await offers.click()
  await expect(page.getByText(`Wird zu Nudeln ${amount} hinzugefügt`)).toBeVisible()
  await page.getByRole('button', { name: 'Datum fehlt' }).click()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText('1 Packung Nudeln ist jetzt im Vorrat.')).toBeVisible()
})

test('Erfassen geht ganz per Tastatur', async ({ page, browserName }, testInfo) => {
  // WebKit erreicht Knöpfe per Tab nur mit einer Systemeinstellung (siehe rahmen.spec.ts).
  test.skip(browserName === 'webkit', 'Tab-Reihenfolge nur in Chromium')
  await page.goto('/neu/manuell')
  await expect(search(page)).toBeFocused()

  await page.keyboard.type('reis')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /^Reis\s*Getreide/ })).toBeFocused()
  await page.keyboard.press('Enter')
  // Nach der Wahl geht es direkt mit dem Inhalt weiter
  await expect(content(page)).toBeFocused()
  await page.keyboard.type(contentFor(testInfo, 20))
  await tabUntilFocused(page, bestBefore(page))
  await page.keyboard.type('31.12.2027')
  await page.keyboard.press('Enter')
  await expect(form(page).getByRole('list', { name: 'MHD und Anzahl' })).toContainText('31.12.2027')
  await tabUntilFocused(page, page.getByRole('button', { name: 'Speichern' }))
  await page.keyboard.press('Enter')

  await expect(page.getByText(/1 Packung Reis ist jetzt im Vorrat\./)).toBeVisible()
})

async function tabUntilFocused(page: Page, target: ReturnType<Page['locator']>) {
  for (let step = 0; step < 25; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}
