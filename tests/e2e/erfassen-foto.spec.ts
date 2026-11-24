// Foto-Erfassung (#61 bis #66) mit erzeugten Testbildern, nie mit echten Fotos. Die Kamera läuft
// über den Rückfall der Dateiauswahl (headless Chromium hat keine Kamera-Erlaubnis). In den
// E2E-Tests ist die KI im Haushalt aus (Fake-Adapter, `ki_aktiv = false`): Der Test „KI aus“ nutzt
// die echte Antwort 503. Für den vollen Ablauf liefert eine abgefangene /api/recognize die
// Vorschläge, wie sie der Fake-Adapter mit festen Antworten gäbe. Läuft im Projekt „foto“
// nacheinander, weil alle Tests denselben Entwurf des Admins nutzen.
import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { attemptOf } from '../helpers/attempt'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'
import {
  draftSaved,
  fakeRecognition,
  proposalFor,
  readProposal,
  shoot,
  shootAndRead,
  startFresh,
} from '../helpers/photo-capture'

test.describe.configure({ mode: 'serial' })

const SHOTS = 'shots'

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
  const pageResponse = page.waitForResponse(
    (response) => response.request().resourceType() === 'document',
  )
  await startFresh(page)
  // Kamera nur für die eigene Seite (#198), die CSP-Prüfung läuft in jedem Test mit
  expect((await pageResponse).headers()['permissions-policy']).toContain('camera=(self)')

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

test('Stufen: mittel Sucher oben und Auslöser unten, ab „breit“ Kamera links und Formular rechts', async ({
  page,
}) => {
  await startFresh(page)
  const camera = page.getByRole('region', { name: 'Vorderseite der Verpackung' })
  const reviewForm = page.getByRole('form', { name: 'Foto-Erfassung prüfen' })
  const shutter = page.getByRole('button', { name: 'Foto aufnehmen' })

  // Duo hochkant (M12-05): nichts Antippbares im Streifen um die waagrechte Falz
  await page.setViewportSize({ width: 669, height: 867 })
  const fold = 867 / 2
  await expect(reviewForm).toHaveCount(0)
  const shutterBox = await shutter.boundingBox()
  expect(shutterBox?.y ?? 0).toBeGreaterThanOrEqual(fold + 12)
  const onFold = await camera.evaluate((section, middle) => {
    return [...section.querySelectorAll('button')].filter((button) => {
      const rect = button.getBoundingClientRect()
      return rect.height > 0 && rect.top < middle + 12 && rect.bottom > middle - 12
    }).length
  }, fold)
  expect(onFold).toBe(0)

  // Duo quer: Kamera links, Formular rechts, die Falz bleibt frei (UX §8.5 „Am PC“, M12-06)
  await page.setViewportSize({ width: 951, height: 585 })
  await expect(reviewForm).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Erfassen' })).toBeVisible()
  const [cameraBox, formBox] = await Promise.all([camera.boundingBox(), reviewForm.boundingBox()])
  expect(formBox?.x ?? 0).toBeGreaterThanOrEqual((cameraBox?.x ?? 0) + (cameraBox?.width ?? 0))
  await expectNothingOnVerticalFold(page)

  await page.setViewportSize({ width: 1280, height: 800 })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }

  // Kamera zu: das Formular bleibt, jetzt allein, und der Fokus wandert hinein
  await page.getByRole('button', { name: 'Kamera schließen' }).click()
  await expect(camera).toHaveCount(0)
  await expect(reviewForm).toBeVisible()
  await expect(reviewForm.locator(':focus')).toHaveCount(1)
})

test('Foto-Fluss: Erkennung füllt Vorschläge, offenes MHD wird entschieden, Speichern', async ({
  page,
}) => {
  await fakeRecognition(page, SUGGESTIONS)
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

  // Per Tastatur: Das entschiedene Foto verschwindet, der Fokus geht zur Liste der Daten (#269)
  await page.getByRole('button', { name: 'Datum fehlt' }).first().press('Enter')
  await expect(page.getByText('Noch zu klären')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'MHD und Anzahl' })).toBeFocused()
  const saved = draftSaved(page, '"datum":"2027-09-30","genauigkeit":"tag","art":"mhd","anzahl":6')
  await page.getByRole('button', { name: '6 Packungen mit 30.09.2027' }).click()
  await expect(page.getByText('7 × Nudeln 487 g')).toBeVisible()

  // Entwurf fortsetzen nach Neuladen
  await saved
  await page.reload()
  await expect(page.getByLabel('Inhalt je Packung')).toHaveValue('487 g')
  await expect(page.getByText('7 × Nudeln 487 g')).toBeVisible()

  // „Neu“ fragt zuerst, ob fortgesetzt werden soll
  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toBeVisible()
  await expectAccessibleLayout(page)
  await screenshot(page, 'fortsetzen-375')
  await page.getByRole('link', { name: 'Fortsetzen' }).click()
  await expect(page).toHaveURL(/\/neu\/foto$/)

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { name: 'Gespeichert' })).toBeVisible()
  await expect(page.getByText('7 Packungen Nudeln hinzugefügt.')).toBeVisible()

  // Der Entwurf ist verbraucht: /neu fragt nicht mehr. Die Erkennung ist aus, deshalb führt „Neu“
  // trotz der Foto-Erfassung eben ins Formular und sagt warum (#79).
  await page.goto('/neu')
  await expect(page).toHaveURL(/\/neu\/manuell$/)
  await expect(
    page.getByRole('status').filter({ hasText: /Foto-Erkennung ist ausgeschaltet/ }),
  ).toBeVisible()
  await expectAccessibleLayout(page)
})

test('Erkennung aus: freundlicher Übergang zur Eingabe von Hand, Schätzung nicht möglich', async ({
  page,
}, testInfo) => {
  // Eigener Inhalt je Versuch: Sonst erkennt ein Retry die Nudeln des ersten Versuchs wieder, wählt
  // sie vor, und „Von der KI schätzen lassen“ fehlt (#272)
  const grams = 488 + 20 * attemptOf(testInfo)
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
  await page.getByLabel('Inhalt je Packung').fill(`${String(grams)} g`)
  await page.getByRole('button', { name: 'Keine Nährwerttabelle' }).click()
  await page.getByRole('button', { name: 'Von der KI schätzen lassen' }).click()
  await expect(page.getByRole('status').filter({ hasText: /ausgeschaltet/ })).not.toHaveCount(0)
  const saved = draftSaved(page, `"inhaltWert":${String(grams)}`, '"ohneDatum":true')
  await page.getByRole('button', { name: 'Datum fehlt', exact: true }).click()
  // Erst prüfen, wenn der Knopf nicht mehr „Schätzt …“ zeigt (halbtransparent während des Ladens)
  await expect(page.getByRole('button', { name: 'Von der KI schätzen lassen' })).toBeEnabled()
  await expectAccessibleLayout(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await screenshot(page, 'ki-aus-1280')

  // Nach dem Fortsetzen derselbe Satz, kein „Vorschlag der Erkennung“ für Getipptes (#210)
  await saved
  await page.reload()
  await expect(page.getByLabel('Inhalt je Packung')).toHaveValue(`${String(grams)} g`)
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
  const { fotoId } = (await (await uploaded).json()) as { fotoId: string }

  // Das Foto behält seine eigenen, strengeren Header (#198)
  const photo = await page.request.get(`/api/photos/${fotoId}?variante=vorschau`)
  expect(photo.status()).toBe(200)
  expect(photo.headers()['content-security-policy']).toBe("default-src 'none'; sandbox")
  expect(photo.headers()['cross-origin-resource-policy']).toBe('same-origin')
  expect(photo.headers()['x-content-type-options']).toBe('nosniff')

  await page.goto('/neu')
  await page.getByRole('button', { name: 'Verwerfen' }).click()

  await expect(page).toHaveURL(/\/neu\/(foto|manuell)$/)
  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toHaveCount(0)
})

test('„Abbrechen“ mit Entwurf: für später behalten oder verwerfen (#285)', async ({ page }) => {
  await page.goto('/statistik')
  await waitForHydration(page)
  await startFresh(page)
  // Vollbild: keine Tab-Leiste, auch nicht hinter der Kamera
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0)
  const uploaded = page.waitForResponse(
    (response) => response.url().includes('/api/photos') && response.request().method() === 'POST',
  )
  await shoot(page, '#468')
  await uploaded
  await page.getByRole('button', { name: 'Kamera schließen' }).click()

  const cancel = page.getByRole('link', { name: 'Abbrechen' })
  const sheet = page.getByRole('dialog', { name: 'Erfassung abbrechen?' })
  await cancel.click()
  await expect(sheet).toContainText('als Entwurf auf dem NAS')
  await expectAccessibleLayout(page)
  await sheet.getByRole('button', { name: 'Für später behalten' }).click()
  await expect(page).toHaveURL(/\/statistik$/)

  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toBeVisible()
  await page.getByRole('link', { name: 'Fortsetzen' }).click()
  await expect(page).toHaveURL(/\/neu\/foto$/)

  await cancel.click()
  await sheet.getByRole('button', { name: 'Verwerfen' }).click()
  await expect(page).toHaveURL(/\/statistik$/)
  await page.goto('/neu')
  await expect(page.getByRole('dialog', { name: 'Erfassung fortsetzen?' })).toHaveCount(0)
})

test('Vorschlag einer neuen Lebensmittelart: ablehnen oder übernehmen (#142)', async ({
  page,
}, testInfo) => {
  const name = `Testkorn ${String(attemptOf(testInfo))}`
  const searchbox = page.getByRole('searchbox', { name: 'Lebensmittelart suchen' })
  await fakeRecognition(page, [proposalFor(name)])

  // Nichts wird von selbst angelegt oder gewählt
  const offer = await readProposal(page, name)
  await expect(offer).toContainText(
    `Neue Lebensmittelart „${name}“ unter „Nudeln, Reis und Getreide“ anlegen?`,
  )
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toHaveCount(0)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
  await offer.getByRole('button', { name: 'Andere wählen' }).click()
  await expect(offer).toHaveCount(0)
  await expect(searchbox).toBeFocused()
  await searchbox.fill(name)
  await expect(page.getByText(/^Keine Lebensmittelart gefunden\. Versucht/)).toBeVisible()

  // Neuer Durchlauf: „Übernehmen“ legt die Art an und wählt sie
  const again = await readProposal(page, name)
  await again.getByRole('button', { name: 'Übernehmen' }).click()
  await expect(again).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  const review = page.getByRole('form', { name: 'Foto-Erfassung prüfen' })
  await expect(review).toContainText(name)
  await expect(review).toContainText('› Nudeln, Reis und Getreide')
  await expect(page.getByLabel('Inhalt je Packung')).toBeFocused()
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('übernimmt den Vorschlag einer neuen Lebensmittelart (#142, #298)', async ({
    page,
  }, testInfo) => {
    const name = `Testkorn Mitglied ${String(attemptOf(testInfo))}`
    await signInViaUi(page, E2E_MEMBER)
    await fakeRecognition(page, [proposalFor(name)])

    const offer = await readProposal(page, name)

    // Dasselbe Angebot wie für den Admin, ohne Satz über Admin-Rechte
    await expect(offer).toHaveText(/^Keine Lebensmittelart der Liste passt\. Neue .*Andere wählen$/)
    await expect(offer.getByRole('button', { name: 'Ändern' })).toBeVisible()
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await expectAccessibleLayout(page)
    }
    await offer.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(offer).toHaveCount(0)
    const review = page.getByRole('form', { name: 'Foto-Erfassung prüfen' })
    await expect(review).toContainText(name)
    await expect(review).toContainText('› Nudeln, Reis und Getreide')
    // Aufräumen: Der Entwurf des Mitglieds bleibt nicht liegen
    await page.getByRole('link', { name: 'Abbrechen' }).click()
    await page
      .getByRole('dialog', { name: 'Erfassung abbrechen?' })
      .getByRole('button', { name: 'Verwerfen' })
      .click()
    await expect(page).not.toHaveURL(/\/neu/)
  })
})
