// Foto-Erfassung (#61 bis #66) mit erzeugten Testbildern, nie mit echten Fotos. Die Kamera läuft
// über den Rückfall der Dateiauswahl (headless Chromium hat keine Kamera-Erlaubnis). In den
// E2E-Tests ist die KI im Haushalt aus (Fake-Adapter, `ki_aktiv = false`): Der Test „KI aus“ nutzt
// die echte Antwort 503. Für den vollen Ablauf liefert eine abgefangene /api/recognize die
// Vorschläge, wie sie der Fake-Adapter mit festen Antworten gäbe. Läuft im Projekt „foto“
// nacheinander, weil alle Tests denselben Entwurf des Admins nutzen.
import { expect, test, type Page, type Route } from '@playwright/test'
import sharp from 'sharp'
import { expectAccessibleLayout } from '../helpers/page-checks'

test.describe.configure({ mode: 'serial' })

const SHOTS = 'shots'

async function testImage(color: string) {
  return sharp({ create: { width: 320, height: 240, channels: 3, background: color } })
    .jpeg()
    .toBuffer()
}

async function shoot(page: Page, color: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'foto.jpg',
    mimeType: 'image/jpeg',
    buffer: await testImage(color),
  })
}

/** Foto aufnehmen und warten, bis Upload und Erkennung durch sind. */
async function shootAndRead(page: Page, color: string) {
  const recognized = page.waitForResponse('**/api/recognize')
  await shoot(page, color)
  await recognized
}

const SUGGESTIONS = [
  {
    role: 'verpackung',
    packaging: {
      name: 'Spaghetti',
      foodTypeKey: 'nudeln',
      container: 'packung',
      content: { value: 487, unit: 'g' },
      drainedWeightG: null,
      confidence: 'high',
    },
  },
  {
    role: 'naehrwerte',
    nutrition: {
      values: { kcal: 359, protein: 12.5, carbs: 71, fat: 2 },
      isPerPortion: false,
      source: 'label',
      confidence: 'high',
    },
  },
  {
    role: 'mhd',
    conflictingDate: null,
    bestBefore: {
      bestBefore: { date: '2027-09-30', precision: 'day', isEstimated: false },
      kind: 'best-before',
      rawText: '30.09.2027',
      confidence: 'high',
    },
  },
  {
    role: 'mhd',
    conflictingDate: null,
    bestBefore: { bestBefore: null, kind: null, rawText: null, confidence: 'low' },
  },
]

/** Antworten der Erkennung der Reihe nach: Verpackung, Nährwerte, MHD lesbar, MHD unlesbar. */
async function fakeRecognition(page: Page) {
  let call = 0
  await page.route('**/api/recognize', async (route: Route) => {
    const body = SUGGESTIONS[Math.min(call, SUGGESTIONS.length - 1)]
    call += 1
    await route.fulfill({ json: body })
  })
}

async function startFresh(page: Page) {
  await page.goto('/neu/foto')
  const discard = page.getByRole('button', { name: 'Erfassung verwerfen' })
  if (await discard.isVisible()) {
    await discard.click()
  }
  await expect(page.getByRole('heading', { name: 'Vorderseite der Verpackung' })).toBeVisible()
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/${SHOTS}/foto-${name}.png`,
    caret: 'initial',
    fullPage: true,
  })
}

test('Kamera im Vollbild und dunkel, ohne Kamera ist „Von Hand eintragen“ der Hauptknopf', async ({
  page,
}) => {
  await startFresh(page)

  const camera = page.getByRole('region', { name: 'Vorderseite der Verpackung' })
  await expect(camera).toBeVisible()
  await expect(page.getByRole('list', { name: 'Schritte' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Von Hand eintragen' })).toBeVisible()
  const background = await camera.evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(background).toBe('rgb(0, 0, 0)')
  await expectAccessibleLayout(page)
  await screenshot(page, 'kamera-375')
  await page.setViewportSize({ width: 1280, height: 800 })
  await screenshot(page, 'kamera-1280')
})

test('Foto-Fluss: Erkennung füllt Vorschläge, offenes MHD wird entschieden, Speichern', async ({
  page,
}) => {
  await fakeRecognition(page)
  await startFresh(page)

  await shootAndRead(page, '#c84')
  await expect(page.getByRole('heading', { name: 'Nährwerttabelle' })).toBeVisible()
  await shootAndRead(page, '#eee')
  await expect(page.getByRole('heading', { name: /Datum einer Packung · Packung 1/ })).toBeVisible()
  await shootAndRead(page, '#333')
  await shootAndRead(page, '#555')
  await expect(page.getByRole('list', { name: 'Erfasste Daten' })).toContainText('30.09.2027 × 1')
  await page.getByRole('button', { name: 'Fertig' }).click()

  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  await expect(page.getByLabel('Inhalt je Packung')).toHaveValue('487 g')
  await expect(page.getByLabel('Bezeichnung (freiwillig)')).toHaveValue('Spaghetti')
  await expect(page.getByLabel('Brennwert in kcal')).toHaveValue('359')
  await expect(page.getByText('Noch zu klären')).toBeVisible()
  await expect(page.getByText('nicht lesbar: nochmal oder eintippen')).toBeVisible()

  // Gesperrt, solange das MHD-Foto offen ist: Der Knopf nennt den Grund.
  await page.getByRole('button', { name: 'Speichern' }).click()
  // Sichtbar am Knopf, zusätzlich per aria-live angesagt
  await expect(
    page.locator('p.text-red', { hasText: 'Ein MHD-Foto braucht noch eine Entscheidung.' }),
  ).toBeVisible()
  await expectAccessibleLayout(page)
  await screenshot(page, 'pruefen-375')

  await page.getByRole('button', { name: 'Datum fehlt' }).first().click()
  await page.getByRole('button', { name: '6 Packungen mit 30.09.2027' }).click()
  await expect(page.getByText('7 × Nudeln 487 g')).toBeVisible()

  // Entwurf fortsetzen nach Neuladen
  await page.waitForTimeout(1500)
  await page.reload()
  await expect(page.getByLabel('Inhalt je Packung')).toHaveValue('487 g')
  await expect(page.getByText('7 × Nudeln 487 g')).toBeVisible()

  // „Neu“ fragt zuerst, ob fortgesetzt werden soll
  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toBeVisible()
  await expectAccessibleLayout(page)
  await screenshot(page, 'fortsetzen-375')
  await page.getByRole('button', { name: 'Fortsetzen' }).click()
  await expect(page).toHaveURL(/\/neu\/foto$/)

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { name: 'Gespeichert' })).toBeVisible()
  await expect(page.getByText('7 Packungen Nudeln hinzugefügt.')).toBeVisible()

  // Der Entwurf ist verbraucht: /neu fragt nicht mehr und öffnet den Foto-Weg.
  await page.goto('/neu')
  await expect(page).toHaveURL(/\/neu\/foto$/)
})

test('Erkennung aus: freundlicher Übergang zur Eingabe von Hand, Schätzung nicht möglich', async ({
  page,
}) => {
  await startFresh(page)
  // Der Hinweis steht gleich zu Beginn in der Kamera, nicht erst nach drei Fotos (#210)
  await expect(page.getByRole('status').filter({ hasText: 'Es wird nichts geraten' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Von Hand weiter' })).toBeVisible()

  await shoot(page, '#a63')
  await expect(page.getByRole('heading', { name: 'Nährwerttabelle' })).toBeVisible()
  await page.getByRole('button', { name: 'Kamera schließen' }).click()

  await expect(page.getByText(/Die Foto-Erkennung ist ausgeschaltet/)).toBeVisible()
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill('nudel')
  await page.getByRole('button', { name: /^Nudeln\s*Getreide/ }).click()
  await page.getByLabel('Inhalt je Packung').fill('488 g')
  await page.getByRole('button', { name: 'Keine Nährwerttabelle' }).click()
  await page.getByRole('button', { name: 'Von der KI schätzen lassen' }).click()
  await expect(page.getByRole('status').filter({ hasText: /ausgeschaltet/ })).not.toHaveCount(0)
  await page.getByRole('button', { name: 'Datum fehlt', exact: true }).click()
  // Erst prüfen, wenn der Knopf nicht mehr „Schätzt …“ zeigt (halbtransparent während des Ladens)
  await expect(page.getByRole('button', { name: 'Von der KI schätzen lassen' })).toBeEnabled()
  await expectAccessibleLayout(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await screenshot(page, 'ki-aus-1280')

  // Nach dem Fortsetzen derselbe Satz, kein „Vorschlag der Erkennung“ für Getipptes (#210)
  await page.waitForTimeout(1500)
  await page.reload()
  await expect(page.getByLabel('Inhalt je Packung')).toHaveValue('488 g')
  await expect(page.getByText(/Die Foto-Erkennung ist ausgeschaltet/)).toBeVisible()
  await expect(page.getByText('Vorschlag der Erkennung. Bitte prüfen.')).toHaveCount(0)

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { name: 'Gespeichert' })).toBeVisible()
})

test('Verwerfen auf „Neu“ löscht den Entwurf', async ({ page }) => {
  await startFresh(page)
  const uploaded = page.waitForResponse(
    (response) => response.url().includes('/api/photos') && response.request().method() === 'POST',
  )
  await shoot(page, '#246')
  await uploaded

  await page.goto('/neu')
  await page.getByRole('button', { name: 'Verwerfen' }).click()

  await expect(page).toHaveURL(/\/neu\/(foto|manuell)$/)
  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toHaveCount(0)
})
