import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// „Entsorgt“ und „Noch gut“ auf Bald fällig, Anzeige und Verlauf im Detail (#47, #48). Der Test
// ändert Daten und läuft deshalb nur im Projekt „desktop“, mit einem eigenen Lebensmittel, das
// sonst kein Test nutzt. Am Ende ist davon nichts mehr im Vorrat.

const FOOD = 'Rotkohl (Konserve)'
const EXPIRED = '01.10.2026'

const todayInBerlin = () =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())

const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })
const entryLink = (page: Page) => page.getByRole('link', { name: `× ${FOOD}` })

/** Zwei abgelaufene Packungen über die manuelle Erfassung (#52). */
async function captureExpired(page: Page) {
  await page.goto('/neu/manuell')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill('rotkohl')
  await page.getByRole('button', { name: /^Rotkohl \(Konserve\)/ }).click()
  await page.getByLabel('Inhalt je Packung').fill('680 g')
  const bestBefore = page.getByLabel('Mindestens haltbar bis')
  for (let count = 0; count < 2; count += 1) {
    await bestBefore.fill(EXPIRED)
    await bestBefore.press('Enter')
  }
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`2 Packungen ${FOOD} hinzugefügt.`)).toBeVisible()
}

test('Entsorgt mit Rückgängig, Noch gut mit Anzeige und Verlauf', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
  await captureExpired(page)
  await page.goto('/uebersicht/bald-faellig')
  await expect(entryLink(page)).toBeVisible()
  // Lokal mit wiederverwendetem Server können Packungen eines früheren Laufs dazukommen
  const count = Number(/^(\d+) ×/.exec(await entryLink(page).innerText())?.[1])
  expect(count).toBeGreaterThanOrEqual(2)
  await expectAccessibleLayout(page)

  // Entsorgt nimmt eine Packung, Rückgängig holt sie zurück
  await page.getByRole('button', { name: `1 Packung ${FOOD} entsorgt` }).click()
  const discarded = undoBar(page, `${FOOD}: 1 Packung entsorgt (${EXPIRED})`)
  await expect(discarded).toBeVisible()
  await expect(entryLink(page)).toContainText(`${String(count - 1)} × ${FOOD}`)
  await discarded.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entryLink(page)).toContainText(`${String(count)} × ${FOOD}`)

  // Noch gut prüft beide Packungen, der Eintrag verlässt „Abgelaufen“
  const checked = `noch gut (geprüft am ${todayInBerlin()})`
  const detailPath = (await entryLink(page).getAttribute('href')) ?? ''
  const stillGood = page.getByRole('button', { name: `${FOOD} noch gut` })
  await stillGood.click()
  const checkedBar = undoBar(page, `${FOOD}: ${String(count)} Packungen ${checked}`)
  await expect(checkedBar).toBeVisible()
  await expect(entryLink(page)).toHaveCount(0)
  await checkedBar.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entryLink(page)).toContainText(`${String(count)} × ${FOOD}`)
  await stillGood.click()
  await expect(entryLink(page)).toHaveCount(0)

  // Im Detail: Wort an der Datumszeile und Verlauf
  await page.goto(detailPath)
  await expect(page.getByRole('heading', { level: 1, name: FOOD })).toBeVisible()
  const dateRow = page.getByRole('button', { name: new RegExp(`^${EXPIRED}`) })
  await expect(dateRow).toContainText(checked)
  const history = page.getByRole('list', { name: 'Verlauf' })
  await expect(history.getByRole('listitem').first()).toHaveText(
    new RegExp(`Noch gut geprüft.*MHD ${EXPIRED}`),
  )
  await expectAccessibleLayout(page)

  // Aufräumen über das Blatt: alle Packungen entsorgen, danach steht es im Verlauf
  for (let left = count; left > 0; left -= 1) {
    await dateRow.click()
    await page.getByRole('button', { name: '1 Packung entsorgt' }).click()
    await expect(undoBar(page, `${FOOD}: 1 Packung entsorgt`)).toBeVisible()
  }
  await expect(page.getByText('Aktuell nichts im Vorrat.')).toBeVisible()
  await expect(history.getByRole('listitem').first()).toContainText('Entsorgt')
})
