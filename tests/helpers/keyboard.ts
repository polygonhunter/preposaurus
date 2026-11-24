import type { Locator, Page } from '@playwright/test'
import { expect } from './e2e-test'

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/**
 * Per Tab bis zum Ziel. Höchstens so viele Schritte, wie die Seite fokussierbare Elemente hat:
 * Danach war jedes einmal dran, ein unerreichbares Ziel lässt die Prüfung auf den Fokus scheitern.
 * Eine feste Zahl reicht nicht, weil parallele Tests Auswahl-Knöpfe hinzufügen (z. B. Lagerorte, #301).
 */
export async function tabUntilFocused(page: Page, target: Locator) {
  const steps = await page.locator(TABBABLE).count()
  for (let step = 0; step < steps; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}
