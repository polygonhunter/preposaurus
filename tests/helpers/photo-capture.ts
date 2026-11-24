// Bausteine der Foto-Tests (#61 bis #66, #142): erzeugte Testbilder statt echter Fotos, die Kamera
// über den Rückfall der Dateiauswahl und eine abgefangene /api/recognize mit festen Vorschlägen,
// wie sie der Fake-Adapter gäbe (in den E2E-Tests ist die KI im Haushalt aus).
import type { Page, Route } from '@playwright/test'
import sharp from 'sharp'
import { expect } from './e2e-test'

async function testImage(color: string) {
  return sharp({ create: { width: 320, height: 240, channels: 3, background: color } })
    .jpeg()
    .toBuffer()
}

export async function shoot(page: Page, color: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'foto.jpg',
    mimeType: 'image/jpeg',
    buffer: await testImage(color),
  })
}

/** Foto aufnehmen und warten, bis Upload und Erkennung durch sind. */
export async function shootAndRead(page: Page, color: string) {
  const recognized = page.waitForResponse('**/api/recognize')
  await shoot(page, color)
  await recognized
}

/** Antworten der Erkennung der Reihe nach, die letzte gilt für alle weiteren Fotos. */
export async function fakeRecognition(page: Page, suggestions: readonly unknown[]) {
  let call = 0
  await page.route('**/api/recognize', async (route: Route) => {
    const body = suggestions[Math.min(call, suggestions.length - 1)]
    call += 1
    await route.fulfill({ json: body })
  })
}

/**
 * Wartet, bis der Entwurf mit diesem Stand gesichert ist (Server Action, usePhotoDraftSync). Vor
 * der Änderung aufrufen. Eine feste Wartezeit reichte unter Last nicht: Das Neuladen brach die
 * Sicherung ab, der fortgesetzte Entwurf war leer (#272).
 */
export function draftSaved(page: Page, ...parts: readonly string[]) {
  return page.waitForResponse((response) => {
    const body = response.request().postData() ?? ''
    return (
      response.request().method() === 'POST' &&
      response.request().headers()['next-action'] !== undefined &&
      parts.every((part) => body.includes(part))
    )
  })
}

/** Foto-Weg ohne offenen Entwurf: ein liegengebliebener wird verworfen. */
export async function startFresh(page: Page) {
  await page.goto('/neu/foto')
  const discard = page.getByRole('button', { name: 'Erfassung verwerfen' })
  if (await discard.isVisible()) {
    await discard.click()
  }
  await expect(page.getByRole('heading', { name: 'Vorderseite der Verpackung' })).toBeVisible()
}

/** Erkennung ohne passende Art: Vorschlag einer neuen (#142), so wie ihn /api/recognize liefert */
export const proposalFor = (name: string) => ({
  role: 'verpackung',
  packaging: {
    name: null,
    foodTypeKey: null,
    newFoodType: { name, categoryName: 'Nudeln, Reis und Getreide' },
    container: 'packung',
    content: { value: 250, unit: 'g' },
    drainedWeightG: null,
    confidence: 'medium',
  },
})

/** Frischer Foto-Weg, ein Verpackungsfoto, Kamera zu: Das Angebot steht im Prüfen. */
export async function readProposal(page: Page, name: string) {
  await startFresh(page)
  await shootAndRead(page, '#b95')
  await page.getByRole('button', { name: 'Kamera schließen' }).click()
  const offer = page.getByRole('region', { name: 'Vorschlag der Erkennung' })
  await expect(offer).toContainText(`„${name}“`)
  return offer
}
