import { expect, type Page } from '@playwright/test'

// Die Leiste unten (Rückgängig oder Fehler) und ihre Ansage sind getrennt (#274): Die Leiste ist
// eine Gruppe mit der Meldung als Namen, angesagt wird im immer vorhandenen Live-Bereich.

type LiveRole = 'status' | 'alert'

/** Die sichtbare Leiste mit dieser Meldung. */
export const noticeBar = (page: Page, text: string) => page.getByRole('group', { name: text })

/** Der Live-Bereich, der die Meldung gerade ansagt. */
const announcement = (page: Page, text: string, role: LiveRole = 'status') =>
  page.getByRole(role).filter({ hasText: text })

/** Leiste sichtbar und genau einmal angesagt; die Leiste selbst hat keine Live-Rolle. */
export async function expectNotice(page: Page, text: string, role: LiveRole = 'status') {
  await expect(noticeBar(page, text)).toBeVisible()
  await expect(announcement(page, text, role)).toHaveCount(1)
}

const BEFORE = 'data-e2e-live-before'

/** Merkt sich alle Live-Bereiche, die es vor einer Handlung schon gibt. */
export async function markLiveRegions(page: Page) {
  await page.locator('[role="status"], [role="alert"]').evaluateAll((regions, attribute) => {
    for (const region of regions) region.setAttribute(attribute, '')
  }, BEFORE)
}

/**
 * Die Meldung steht in einem Live-Bereich, den es schon vor der Handlung gab. Ein Bereich, der erst
 * mit seinem Text entsteht, wird nicht zuverlässig angesagt (#274).
 */
export async function expectAnnouncedInExistingRegion(
  page: Page,
  text: string,
  role: LiveRole = 'status',
) {
  await expect(page.locator(`[role="${role}"][${BEFORE}]`).filter({ hasText: text })).toHaveCount(1)
}
