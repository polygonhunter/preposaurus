import type { Page } from '@playwright/test'
import { expect } from './e2e-test'

/** Eigene Lebensmittelart als Admin über die Kategorie anlegen (#126), z. B. eine je Versuch. */
export async function createOwnFoodType(page: Page, categoryName: string, name: string) {
  await page.goto('/einstellungen/kategorien')
  await page.getByRole('link', { name: new RegExp(`^${categoryName}`) }).click()
  await page.getByRole('link', { name: 'Neue Lebensmittelart' }).click()
  await page.getByLabel('Name der Lebensmittelart').fill(name)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}
