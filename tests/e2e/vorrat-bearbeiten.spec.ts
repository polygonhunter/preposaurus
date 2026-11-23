import { expect, test, type Page } from '@playwright/test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Bearbeiten, Datum nachtragen, Packungen hinzufügen und Fehlerfassung löschen (#49, #50, #195).
// Datenändernde Tests laufen nur im Projekt „desktop“, jeder mit einem eigenen Lebensmittel, das
// sonst kein Test nutzt. Am Ende löscht der Admin es wieder, es bleibt nichts übrig.

function onlyDesktop(projectName: string) {
  test.skip(projectName !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
}

const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })
const escape = (text: string) => text.replace(/[()]/g, '\\$&')

type Food = Readonly<{ name: string; search: string }>

/** Packungen mit „Datum fehlt“ über die manuelle Erfassung (#52, #116). */
async function captureWithoutDate(page: Page, food: Food, count = 1) {
  await page.goto('/neu/manuell')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill(food.search)
  await page.getByRole('button', { name: new RegExp(`^${escape(food.name)}`) }).click()
  await page.getByLabel('Inhalt je Packung').fill('330 g')
  for (let added = 0; added < count; added += 1) {
    await page.getByRole('button', { name: 'Datum fehlt' }).click()
  }
  await page.getByRole('button', { name: 'Speichern' }).click()
  const packages = count === 1 ? '1 Packung' : `${String(count)} Packungen`
  await expect(page.getByText(`${packages} ${food.name} hinzugefügt.`)).toBeVisible()
}

async function openDetail(page: Page, food: Food) {
  await page.goto(`/vorrat?suche=${encodeURIComponent(food.search)}`)
  await page
    .getByRole('link', { name: new RegExp(`^${escape(food.name)}`) })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: food.name })).toBeVisible()
}

/** Aufräumen: Der Admin löscht das Produkt endgültig, danach findet die Suche nichts mehr. */
async function deleteProduct(page: Page, food: Food) {
  await openDetail(page, food)
  await page.getByRole('button', { name: 'Fehlerfassung löschen …' }).click()
  const dialog = page.getByRole('dialog', { name: 'Endgültig löschen?' })
  await expect(dialog.getByText('Das lässt sich nicht rückgängig machen.')).toBeVisible()
  await expectAccessibleLayout(page)
  await dialog.getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(page).not.toHaveURL(/\/vorrat\/art\//)
  await page.goto(`/vorrat?suche=${encodeURIComponent(food.search)}`)
  await expect(page.getByRole('link', { name: new RegExp(`^${escape(food.name)}`) })).toHaveCount(0)
}

test('Packungen hinzufügen, Datum nachtragen, bearbeiten und löschen', async ({ page }, info) => {
  onlyDesktop(info.project.name)
  const food = { name: 'Spargel (Konserve)', search: 'spargel' }
  await captureWithoutDate(page, food)
  await openDetail(page, food)
  await expectAccessibleLayout(page)

  // Packungen hinzufügen: Produkt vorgewählt, der Fokus steht gleich im MHD (#195, UX §8.4)
  await page.getByRole('link', { name: 'Packungen hinzufügen' }).click()
  await expect(page).toHaveURL(/\/neu\/manuell\?produkt=/)
  const bestBefore = page.getByLabel('Mindestens haltbar bis')
  await expect(bestBefore).toBeFocused()
  await expect(page.getByText(/^Wird zu Spargel \(Konserve\)/).first()).toBeVisible()
  await expectAccessibleLayout(page)
  await bestBefore.fill('09/2027')
  await bestBefore.press('Enter')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${food.name} hinzugefügt.`)).toBeVisible()

  // Datum nachtragen über das Blatt der Zeile „Datum fehlt“ (#116)
  await openDetail(page, food)
  await expect(page.getByRole('button', { name: /^09\/2027/ })).toBeVisible()
  await page.getByRole('button', { name: /^Datum fehlt/ }).click()
  await page.getByRole('link', { name: 'Datum nachtragen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Datum nachtragen' })).toBeVisible()
  await expectAccessibleLayout(page)
  await page.getByLabel('Mindestens haltbar bis').fill('2028')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { level: 1, name: food.name })).toBeVisible()
  await expect(page.getByRole('button', { name: /^2028/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Datum fehlt/ })).toHaveCount(0)

  // Angaben bearbeiten: Bezeichnung und eigene Nährwerte (#49)
  await page.getByRole('link', { name: 'Angaben bearbeiten' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Angaben bearbeiten' })).toBeVisible()
  await expectAccessibleLayout(page)
  await page.getByLabel('Bezeichnung').fill('Spargel vom Hof')
  await page.getByLabel('Brennwert in kcal').fill('20')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { level: 1, name: food.name })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Angaben · Spargel vom Hof' })).toBeVisible()
  await expect(page.getByText('von Hand')).toBeVisible()

  await deleteProduct(page, food)
})

test('Erfassen aus Nachkaufen ist mit der Lebensmittelart vorbelegt', async ({ page }, info) => {
  onlyDesktop(info.project.name)
  const food = { name: 'Rote Bete (Konserve)', search: 'rote bete' }
  // Zwei Packungen, damit nach dem Entnehmen eine im Vorrat bleibt und die Suche sie findet
  await captureWithoutDate(page, food, 2)
  await openDetail(page, food)

  // Entnehmen und auf die Liste setzen, dort abhaken und „Jetzt erfassen“ (#195, F5)
  await page.getByRole('button', { name: /^1 entnehmen · / }).click()
  await undoBar(page, '1 Packung verbraucht').getByRole('button', { name: 'Nachkaufen' }).click()
  await expect(undoBar(page, 'steht jetzt auf der Nachkaufen-Liste.')).toBeVisible()
  await page.goto('/nachkaufen')
  await page.getByRole('checkbox', { name: food.name }).click()
  await undoBar(page, `${food.name} abgehakt.`)
    .getByRole('button', { name: 'Jetzt erfassen' })
    .click()
  await expect(page).toHaveURL(/\/neu\/manuell\?art=/, { timeout: 15_000 })
  await expect(page.getByLabel('Mindestens haltbar bis')).toBeFocused()
  await expect(page.getByText(/^Wird zu Rote Bete \(Konserve\)/).first()).toBeVisible()
  await expectAccessibleLayout(page)

  // Aufräumen: Eintrag entfernen, Produkt löschen
  await page.goto('/nachkaufen')
  await page.getByRole('button', { name: `${food.name} entfernen` }).click()
  await expect(page.getByRole('checkbox', { name: food.name })).toHaveCount(0)
  await deleteProduct(page, food)
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('bearbeitet, sieht aber kein endgültiges Löschen', async ({ page }) => {
    await signInViaUi(page, E2E_MEMBER)
    await openDetail(page, { name: 'Linsen', search: 'lins' })

    await expect(page.getByRole('link', { name: 'Angaben bearbeiten' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fehlerfassung löschen …' })).toHaveCount(0)
    await page
      .getByRole('button', { name: /^\d{2}\.\d{2}\.\d{4}|^\d{2}\/\d{4}/ })
      .first()
      .click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('link', { name: 'Datum ändern' })).toBeVisible()
    await expect(sheet.getByRole('button', { name: '1 Packung löschen …' })).toHaveCount(0)
    await expectAccessibleLayout(page)
  })
})
