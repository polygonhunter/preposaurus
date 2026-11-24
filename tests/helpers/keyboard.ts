import type { Locator, Page } from '@playwright/test'
import { expect } from './e2e-test'

/** Per Tab bis zum Ziel, höchstens 25 Schritte; sonst scheitert die Prüfung auf den Fokus. */
export async function tabUntilFocused(page: Page, target: Locator) {
  for (let step = 0; step < 25; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}
