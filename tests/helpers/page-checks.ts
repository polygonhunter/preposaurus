import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoAxeViolations(page: Page): Promise<void> {
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
