import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// axe misst Farben, wie sie gerade auf dem Bildschirm stehen. Läuft noch ein Übergang, etwa ein
// Knopf, der nach einer Entnahme aus „gesperrt“ (opacity 0.4) zurückblendet, misst es den
// Zwischenstand. Deshalb erst warten, bis alle endlichen Animationen und Übergänge fertig sind.
async function waitForSettledAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
    await Promise.allSettled(finite.map((animation) => animation.finished))
  })
}

// Beim Scrollen schwebt „1 entnehmen“ bewusst über dem Inhalt (DESIGN_SYSTEM §7). axe misst nur den
// Augenblick und zählt die Zeile, die gerade halb darunter liegt, als zu kleines Ziel (target-size).
// Am Seitenende muss alles frei liegen, das prüft axe dort. Dass ein fokussiertes Ziel nie unter
// einer Leiste verschwindet, prüft expectFocusNotObscured (#49).
async function scrollToEnd(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
  })
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  await scrollToEnd(page)
  await waitForSettledAnimations(page)
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  expect(violations.map(({ id, help, nodes }) => ({ id, help, count: nodes.length }))).toEqual([])
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

  expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
}

// Gilt für jede Seite in jedem E2E-Test (CODE_PRINZIPIEN §12, UMSETZUNG §5).
export async function expectAccessibleLayout(page: Page): Promise<void> {
  await expectNoAxeViolations(page)
  await expectNoHorizontalScroll(page)
}

// Bekommt ein Ziel den Fokus, scrollt der Browser es ins Bild. Feste Leisten unten (Tab-Leiste,
// „1 entnehmen“) dürfen es dabei nicht verdecken (WCAG 2.4.11, scroll-padding in globals.css).
// Geprüft wird vom Seitenanfang aus, wo die Leisten über dem Inhalt schweben.
export async function expectFocusNotObscured(target: Locator): Promise<void> {
  await target.page().evaluate(() => {
    window.scrollTo(0, 0)
  })
  await target.focus()
  const isOnTop = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const probes = [rect.top + 1, rect.top + rect.height / 2, rect.bottom - 1]
    return probes.every((y) => {
      const hit = document.elementFromPoint(rect.left + rect.width / 2, y)
      return hit !== null && element.contains(hit)
    })
  })
  expect(isOnTop).toBe(true)
}
