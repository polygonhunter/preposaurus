import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Fokus nach Entfernen, Abhaken und Rückgängig auf Nachkaufen, nur per Tastatur (#269). Verschwindet
// der fokussierte Knopf, geht der Fokus in die nächste Zeile; „Rückgängig“ führt zur Zeile zurück.
// Die Rückgängig-Zeile selbst nimmt den Fokus nicht. Eigene Namen, weil nachkaufen.spec.ts parallel
// dieselbe Liste ändert; neue Einträge stehen nach Erstellung, A steht also immer direkt vor B.

const A = 'Fokusprobe Zwieback'
const B = 'Fokusprobe Knäcke'

const ownList = (page: Page) => page.getByRole('list', { name: 'Eigene Einträge' })
const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })

async function addEntry(page: Page, label: string) {
  await page.getByLabel('Eintrag ergänzen').fill(label)
  await page.getByLabel('Eintrag ergänzen').press('Enter')
  await expect(ownList(page).getByRole('checkbox', { name: label })).toBeVisible()
  // Das geleerte Feld behält den Fokus für den nächsten Eintrag
  await expect(page.getByLabel('Eintrag ergänzen')).toBeFocused()
}

test('Entfernen, Abhaken und Rückgängig führen den Fokus per Tastatur', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Ändert den Beispielhaushalt, läuft nur auf Desktop')
  // Viele Schritte nacheinander, jeder lädt die Liste neu
  test.slow()
  await page.goto('/nachkaufen')
  await addEntry(page, A)
  await addEntry(page, B)
  const checkA = ownList(page).getByRole('checkbox', { name: A })
  const checkB = ownList(page).getByRole('checkbox', { name: B })
  const removeA = page.getByRole('button', { name: `${A} entfernen` })

  // Entfernen: Die Zeile geht, der Fokus in die nächste. Die Rückgängig-Zeile erscheint ohne ihn.
  await removeA.press('Enter')
  const removed = undoBar(page, `${A} entfernt.`)
  await expect(removed).toBeVisible()
  await expect(checkA).toHaveCount(0)
  await expect(checkB).toBeFocused()

  // Rückgängig: zurück auf den Knopf der wiederhergestellten Zeile
  await removed.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(removeA).toBeFocused()

  // Abhaken: Der Eintrag wandert nach „Erledigt“, der Fokus bleibt in der Liste
  await checkA.press('Space')
  const checked = undoBar(page, `${A} abgehakt.`)
  await expect(checked).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Erledigt' }).getByRole('checkbox', { name: A }),
  ).toBeChecked()
  await expect(checkB).toBeFocused()

  await checked.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(checkA).toBeFocused()
  await expect(checkA).not.toBeChecked()
  await expectAccessibleLayout(page)

  for (const label of [A, B]) {
    await page.getByRole('button', { name: `${label} entfernen` }).press('Enter')
    await expect(ownList(page).getByRole('checkbox', { name: label })).toHaveCount(0)
    await expect(page.locator('main :focus')).toHaveCount(1)
  }
})
