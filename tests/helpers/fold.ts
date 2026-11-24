import type { Page } from '@playwright/test'

// Senkrechte Falz wie beim Duo quer (#253). Playwright kennt keine Falz, Chromium kann sie aber per
// DevTools-Protokoll nachstellen: Dann meldet der Browser zwei Viewport Segments, und
// `@media (horizontal-viewport-segments: 2)` greift wie auf dem echten Gerät. So braucht die App
// keinen Testschalter, Produktion und Test laufen durch denselben Code.
export type Fold = Readonly<{ offset: number; maskLength: number }>

// Für das Projekt duo-quer (951 px): die Falz ungefähr in der Mitte, 24 px breit
export const DUO_FOLD: Fold = { offset: 463, maskLength: 24 }

// Option der Projekte in playwright.config.ts, ohne Falz null
export type FoldOptions = Readonly<{ fold: Fold | null }>

type FoldEmulation = Readonly<{ fold: Fold; isMobile: boolean }>

// Nur Chromium. Die Sitzung bleibt bis zum Testende offen, sonst verwirft Chromium die Emulation.
// Ein späteres page.setViewportSize oder page.screenshot setzt die Maße ohne Falz neu und hebt sie
// damit auf.
export async function emulateFold(page: Page, { fold, isMobile }: FoldEmulation): Promise<void> {
  const viewport = page.viewportSize()
  if (viewport === null) throw new Error('Die Falz braucht feste Fenstermaße')
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setDeviceMetricsOverride', {
    ...viewport,
    deviceScaleFactor: 1,
    mobile: isMobile,
    displayFeature: { orientation: 'vertical', ...fold },
  })
}

// Die Falz, wie der Browser sie meldet: rechte Kante des ersten, linke Kante des zweiten Segments.
// Ohne zwei Segments (keine Falz, kein Chromium) null.
export async function readFold(
  page: Page,
): Promise<Readonly<{ start: number; end: number }> | null> {
  return page.evaluate(() => {
    const { viewport } = window as Window & { viewport?: { segments: DOMRect[] | null } }
    const [first, second, ...rest] = viewport?.segments ?? []
    if (first === undefined || second === undefined || rest.length > 0) return null
    return { start: first.right, end: second.left }
  })
}
