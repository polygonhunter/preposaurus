import { expect, type Locator, type Page } from '@playwright/test'

// `page.goto` wartet auf `load`, React übernimmt die Seite oft erst danach. Ein Tastendruck davor
// verpufft, weil der Listener der Tastenkürzel noch fehlt. In der CI scheiterte daran der Test
// „„n“ öffnet Erfassen, „/“ springt in die Suche“ (PRs #255, #256, #257).

// So lange wartet ein Versuch von pressUntil auf die Wirkung, bevor er die Taste erneut drückt
const ATTEMPT_TIMEOUT_MS = 2000

/** Wartet, bis React den Rahmen hydriert hat (Fiber am `main`). Für Prüfungen, dass nichts passiert. */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const main = document.querySelector('main')
    return main !== null && Object.keys(main).some((key) => key.startsWith('__reactFiber$'))
  })
}

/** Drückt die Taste, bis die Erwartung eintritt. Vor der Hydrierung verpufft ein Druck. */
export async function pressUntil(
  page: Page,
  key: string,
  expectation: (timeout: number) => Promise<void>,
): Promise<void> {
  await expect(async () => {
    await page.keyboard.press(key)
    await expectation(ATTEMPT_TIMEOUT_MS)
  }).toPass()
}

/**
 * Klickt einen Absende-Knopf, bis der Browser die Server Action abschickt (POST), höchstens so oft,
 * bis ein POST unterwegs ist. In WebKit verpuffte der zweite Klick auf „Anlegen“ nach einer
 * Fehlermeldung gelegentlich ohne Anfrage (#263). Ein zweiter POST entsteht nie: Sobald einer
 * abging, klickt der Helfer nicht mehr, auch wenn der Knopf danach verschwindet.
 */
export async function clickUntilPosted(page: Page, button: Locator): Promise<void> {
  let posts = 0
  const countPost = (request: { method: () => string }) => {
    if (request.method() === 'POST') posts += 1
  }
  page.on('request', countPost)
  try {
    await expect(async () => {
      if (posts > 0) return
      await button.click({ timeout: ATTEMPT_TIMEOUT_MS })
      await expect.poll(() => posts, { timeout: ATTEMPT_TIMEOUT_MS }).toBeGreaterThan(0)
    }).toPass()
  } finally {
    page.off('request', countPost)
  }
}
