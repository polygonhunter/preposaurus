import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

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

async function expectNoAxeViolations(page: Page): Promise<void> {
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
