// Prüfungen für die Folgeschritte der Einrichtung (#40) in den E2E-Tests.
import { expect, type Page } from '@playwright/test'
import { expectAccessibleLayout } from './page-checks'

type ExpectedStep = Readonly<{
  path: string
  title: string
  /** Nummer in „Schritt 2 von 3“, Standard 2 */
  step?: number
  /** Ohne iPhone-Safari sind es 3 Schritte, mit Home-Bildschirm 4 */
  total?: number
}>

/** Adresse, Titel und Schrittanzeige stimmen, die Seite ist barrierefrei. */
export async function expectSetupStep(page: Page, expected: ExpectedStep): Promise<void> {
  const { path, title, step = 2, total = 3 } = expected
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.getByText(`Schritt ${String(step)} von ${String(total)}`)).toBeVisible()
  await expectAccessibleLayout(page)
}
