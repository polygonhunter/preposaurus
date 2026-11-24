import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { neighbourCheckboxName } from '../helpers/focus-rows'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Fokus nach Entfernen, Abhaken und Rückgängig auf Nachkaufen, nur per Tastatur (#269). Verschwindet
// der fokussierte Knopf, geht der Fokus in die nächste Zeile; „Rückgängig“ führt zur Zeile zurück.
// Die Rückgängig-Zeile selbst nimmt den Fokus nicht. Eigene Namen, weil nachkaufen.spec.ts und
// vorrat-entnehmen.spec.ts parallel dieselbe Liste ändern; die Nachbarzeile wird deshalb direkt vor
// jeder Handlung gelesen.

const A = 'Fokusprobe Zwieback'
const B = 'Fokusprobe Knäcke'

const ownList = (page: Page) => page.getByRole('list', { name: 'Eigene Einträge' })
const ownCheckbox = (page: Page, name: string) =>
  ownList(page).getByRole('checkbox', { name, exact: true })
const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })

async function addEntry(page: Page, label: string) {
  await page.getByLabel('Eintrag ergänzen').fill(label)
  await page.getByLabel('Eintrag ergänzen').press('Enter')
  await expect(ownCheckbox(page, label)).toBeVisible()
  // Das geleerte Feld behält den Fokus für den nächsten Eintrag
  await expect(page.getByLabel('Eintrag ergänzen')).toBeFocused()
}

// Ein abgebrochener erster Versuch lässt A und B stehen; der Retry beginnt ohne sie
async function removeLeftovers(page: Page) {
  for (const label of [A, B]) {
    const remove = page.getByRole('button', { name: `${label} entfernen`, exact: true })
    while ((await remove.count()) > 0) {
      const count = await remove.count()
      await remove.first().click()
      await expect(remove).toHaveCount(count - 1)
    }
  }
}

const neighbourOf = async (page: Page, control: Locator) =>
  ownCheckbox(page, await neighbourCheckboxName(control))

test('Entfernen, Abhaken und Rückgängig führen den Fokus per Tastatur', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Ändert den Beispielhaushalt, läuft nur auf Desktop')
  // Viele Schritte nacheinander, jeder lädt die Liste neu
  test.slow()
  await page.goto('/nachkaufen')
  await removeLeftovers(page)
  await addEntry(page, A)
  await addEntry(page, B)
  const checkA = ownCheckbox(page, A)
  const removeA = page.getByRole('button', { name: `${A} entfernen` })

  // Entfernen: Die Zeile geht, der Fokus in die nächste. Die Rückgängig-Zeile erscheint ohne ihn.
  const afterRemove = await neighbourOf(page, removeA)
  await removeA.press('Enter')
  const removed = undoBar(page, `${A} entfernt.`)
  await expect(removed).toBeVisible()
  await expect(checkA).toHaveCount(0)
  await expect(afterRemove).toBeFocused()

  // Rückgängig: zurück auf den Knopf der wiederhergestellten Zeile
  await removed.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(removeA).toBeFocused()

  // Abhaken: Der Eintrag wandert nach „Erledigt“, der Fokus bleibt in der Liste
  const afterCheck = await neighbourOf(page, checkA)
  await checkA.press('Space')
  const checked = undoBar(page, `${A} abgehakt.`)
  await expect(checked).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Erledigt' }).getByRole('checkbox', { name: A }),
  ).toBeChecked()
  await expect(afterCheck).toBeFocused()

  await checked.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(checkA).toBeFocused()
  await expect(checkA).not.toBeChecked()
  await expectAccessibleLayout(page)

  for (const label of [A, B]) {
    await page.getByRole('button', { name: `${label} entfernen` }).press('Enter')
    await expect(ownCheckbox(page, label)).toHaveCount(0)
    await expect(page.locator('main :focus')).toHaveCount(1)
  }
})
