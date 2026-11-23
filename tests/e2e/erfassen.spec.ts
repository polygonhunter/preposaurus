// Manuelles Erfassen (#52, #53, #54): neues Produkt mit zwei Daten und „Datum fehlt“, Fehler am
// Feld, Tastatur, doppeltes Speichern und das Wiedererkennen danach, Nachschub in höchstens fünf
// Tipps (F2, #207) und die Suche nach Alltagswörtern (#212). Alle Projekte teilen sich eine
// Datenbank, deshalb nutzt jedes Projekt einen eigenen Inhalt (z. B. 412 g) bzw. eine eigene
// Lebensmittelart und erkennt nur sein eigenes Produkt wieder.
import type { Locator, Page, TestInfo } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const PROJECTS = ['iphone', 'duo-aussen', 'duo-hoch', 'duo-quer', 'desktop']

/** Eigener Inhalt je Projekt und Test, damit parallele Läufe sich nicht wiedererkennen */
function contentFor(testInfo: TestInfo, offset: number): string {
  const index = Math.max(PROJECTS.indexOf(testInfo.project.name), 0)
  return `${String(400 + offset + index)} g`
}

/** Eigene Lebensmittelart je Projekt und Test (alle aus Getreide), sonst nicht im Beispielvorrat */
const OWN_FOOD_TYPES: Readonly<Record<string, readonly [restock: string, keyboard: string]>> = {
  iphone: ['Hirse', 'Mehl'],
  'duo-aussen': ['Graupen', 'Grieß'],
  'duo-hoch': ['Quinoa', 'Paniermehl'],
  'duo-quer': ['Couscous', 'Speisestärke'],
  desktop: ['Bulgur', 'Zwieback'],
}

function ownFoodType(testInfo: TestInfo, use: 'restock' | 'keyboard'): string {
  const own = OWN_FOOD_TYPES[testInfo.project.name] ?? OWN_FOOD_TYPES['desktop']
  return own?.[use === 'restock' ? 0 : 1] ?? 'Hirse'
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

const resultFor = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}\\s*Getreide`) })

/** Behälter „Packung“ wählen, ohne eine Vorbelegung wieder abzuwählen */
async function selectPackage(page: Page) {
  const chip = page.getByRole('button', { name: 'Packung', exact: true })
  if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click()
}

async function addDate(page: Page, text: string) {
  await bestBefore(page).fill(text)
  await bestBefore(page).press('Enter')
}

test('Das Formular hat den Umschalter, die Lebensmittelart hat sofort den Fokus', async ({
  page,
}) => {
  // /neu öffnet den zuletzt genutzten Weg, im Beispielvorrat mal Foto, mal manuell. Der Weg
  // selbst ist im Integrationstest von chooseCaptureWay geprüft.
  await page.goto('/neu/manuell')

  await expect(page.getByRole('heading', { level: 1, name: 'Erfassen' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Manuell' })).toHaveAttribute('aria-current', 'page')
  await expect(search(page)).toBeFocused()
  await expectAccessibleLayout(page)
})

test('Fehler stehen am Feld, der Fokus springt zum ersten', async ({ page }) => {
  await page.goto('/neu/manuell')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(search(page)).toHaveAccessibleDescription('Bitte wählt eine Lebensmittelart.')
  await expect(search(page)).toBeFocused()
  await expect(content(page)).toHaveAccessibleDescription(
    /Bitte gebt den Inhalt einer Packung an, z\. B\. 500 g\./,
  )
  await expect(bestBefore(page)).toHaveAccessibleDescription(/Bitte gebt ein MHD ein oder wählt/)
  await expectAccessibleLayout(page)

  // Eingetippt, aber nicht hinzugefügt: Die Meldung sagt, was fehlt.
  await bestBefore(page).fill('2027')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(bestBefore(page)).toHaveAccessibleDescription(/Bitte übernimm das Datum mit Enter/)
  // Fällt eine Zeile weg, bleibt der Fokus im Datumsfeld.
  await bestBefore(page).press('Enter')
  await page.getByRole('button', { name: '2027 entfernen' }).click()
  await expect(bestBefore(page)).toBeFocused()

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
  await selectPackage(page)
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
  await expect(page.getByText('4 Packungen Nudeln hinzugefügt.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Zum Vorrat' })).toBeVisible()
  await expectAccessibleLayout(page)

  await page.getByRole('button', { name: 'Noch eins erfassen' }).click()
  await expect(search(page)).toBeFocused()
  await page
    .getByRole('group', { name: 'Zuletzt genutzt' })
    .getByRole('button', { name: 'Nudeln' })
    .click()
  await content(page).fill(amount)

  // Genau ein Angebot: Das Produkt entstand trotz doppeltem Absenden nur einmal. Das Angebot steht,
  // sobald die Optionen nach „Noch eins“ neu geladen sind.
  await expect(page.getByRole('button', { name: `Zu Nudeln ${amount} hinzufügen` })).toHaveCount(1)
  // Verlässt man den Inhalt, wählt die App das eine passende Produkt vor (#207).
  await content(page).blur()
  await expect(
    page.getByText(`Wird zu Nudeln ${amount} hinzugefügt`, { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: `Zu Nudeln ${amount} hinzufügen` })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Packung', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Datum fehlt' }).click()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText('1 Packung Nudeln hinzugefügt.')).toBeVisible()
})

test('Nach dem Speichern sagt ein Satz, wie lange das Essen jetzt reicht (#231)', async ({
  page,
}, testInfo) => {
  // Gut 5 kg Nudeln sind mehr als zwei Tage kcal für den Haushalt: Die ganze Zahl ändert sich sicher,
  // auch wenn parallel kurz eine Person dazukommt (einstellungen.spec.ts).
  await page.goto('/neu/manuell')
  await chooseNoodles(page)
  await content(page).fill(contentFor(testInfo, 2200))
  await selectPackage(page)
  await addDate(page, '09/2028')
  await addDate(page, '09/2028')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByText('2 Packungen Nudeln hinzugefügt.')).toBeVisible()
  await expect(
    page.getByText(/^Euer Essen reicht jetzt (für [\d,]+ Tage|[\d,]+ statt [\d,]+ Tage)\.$/),
  ).toBeVisible()
  await expectAccessibleLayout(page)
})

test('Erfassen geht ganz per Tastatur', async ({ page, browserName }, testInfo) => {
  // WebKit erreicht Knöpfe per Tab nur mit einer Systemeinstellung (siehe rahmen.spec.ts).
  test.skip(browserName === 'webkit', 'Tab-Reihenfolge nur in Chromium')
  // Eine Art ohne Produkt, sonst wählt die App es vor und springt gleich zum MHD
  const name = ownFoodType(testInfo, 'keyboard')
  await page.goto('/neu/manuell')
  await expect(search(page)).toBeFocused()

  await page.keyboard.type(name.toLowerCase())
  await page.keyboard.press('Tab')
  await expect(resultFor(page, name)).toBeFocused()
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

  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()
})

test('Nachschub eines bekannten Produkts braucht höchstens 5 Tipps (F2, #207, #211)', async ({
  page,
}, testInfo) => {
  const name = ownFoodType(testInfo, 'restock')
  // Vorher einmal erfassen, mit Behälter
  await page.goto('/neu/manuell')
  await search(page).fill(name.toLowerCase())
  await resultFor(page, name).click()
  await content(page).fill('500 g')
  await selectPackage(page)
  await addDate(page, '09/2027')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()

  // F2 (UX §9): Jeder Tipp zählt, Buchstaben tippen nicht. Der Erfassen-Knopf öffnet den zuletzt
  // genutzten Weg (Integrationstest chooseCaptureWay). Hier direkt /neu/manuell, weil die Foto-Tests
  // parallel denselben Admin nutzen, gezählt wird er trotzdem.
  let taps = 0
  const tap = async (target: Locator) => {
    taps += 1
    await target.click()
  }
  await page.goto('/neu/manuell')
  taps += 1
  await expect(search(page)).toBeFocused()
  await page.keyboard.type(name.toLowerCase())
  await tap(resultFor(page, name))

  // Genau ein Produkt dieser Art: vorgewählt, Inhalt und Behälter übernommen, Fokus im MHD
  await expect(page.getByText(`Wird zu ${name} 500 g hinzugefügt`, { exact: true })).toBeVisible()
  await expect(content(page)).toHaveValue('500 g')
  await expect(bestBefore(page)).toBeFocused()
  await page.keyboard.type('05/2028')
  await tap(page.getByRole('button', { name: 'Datum hinzufügen' }))
  // Schnellzahlen wie im Foto-Weg (#211)
  await tap(page.getByRole('button', { name: '2 Packungen mit 05/2028', exact: true }))
  await expect(form(page).getByRole('list', { name: 'Zusammenfassung' })).toContainText(
    `2 × ${name} 500 g`,
  )
  await expectAccessibleLayout(page)
  await tap(page.getByRole('button', { name: 'Speichern' }))
  await expect(page.getByText(`2 Packungen ${name} hinzugefügt.`)).toBeVisible()

  testInfo.annotations.push({ type: 'F2-Tipps', description: String(taps) })
  expect(taps).toBe(5)

  // Kein Doppel: Es gibt weiter genau ein Produkt dieser Art, also wieder die Vorwahl.
  await page.getByRole('button', { name: 'Noch eins erfassen' }).click()
  await search(page).fill(name.toLowerCase())
  await resultFor(page, name).click()
  await expect(page.getByText(`Wird zu ${name} 500 g hinzugefügt`, { exact: true })).toBeVisible()
  // „Neu anlegen“ wählt ab und bleibt abgewählt
  await page.getByRole('button', { name: 'Neu anlegen' }).click()
  await content(page).focus()
  await content(page).blur()
  await expect(page.getByRole('button', { name: `Zu ${name} 500 g hinzufügen` })).toBeVisible()
})

test('Die Suche findet Alltagswörter und zeigt auf Wunsch alle Treffer (#212)', async ({
  page,
}) => {
  await page.goto('/neu/manuell')
  // Erst nach dem Hydrieren tippen, sonst bleibt die Eingabe ohne Suche stehen
  await expect(search(page)).toBeFocused()

  await search(page).fill('Spaghetti')
  await expect(page.getByRole('button', { name: /^Nudeln\s*Getreide/ })).toBeVisible()
  await search(page).fill('Dosentomaten')
  await expect(page.getByRole('button', { name: /^Tomaten \(Konserve/ })).toBeVisible()
  await search(page).fill('knaecke')
  await expect(page.getByRole('button', { name: /^Knäckebrot/ })).toBeVisible()

  await search(page).fill('konserve')
  const hits = page.getByRole('button', { name: /Konserve/ })
  await expect(hits).toHaveCount(8)
  await page.getByRole('button', { name: /^Alle \d+ Treffer zeigen$/ }).click()
  expect(await hits.count()).toBeGreaterThan(8)
  await expectAccessibleLayout(page)
})

async function tabUntilFocused(page: Page, target: ReturnType<Page['locator']>) {
  for (let step = 0; step < 25; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}
