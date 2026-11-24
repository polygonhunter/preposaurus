// Zwei Hinweise im manuellen Erfassen: „zu verbrauchen bis“ wird ein Verbrauchsdatum (#294), und
// Detail und Bald fällig bieten dafür kein „Noch gut“ an. Eine unplausible Packungsmenge zeigt
// „bitte prüfen“, sperrt das Speichern aber nicht (#295). Beide Tests legen Daten an und laufen nur
// im Projekt „desktop“, je Versuch mit einer eigenen Lebensmittelart, die sonst kein Test nutzt.
import type { Page, TestInfo } from '@playwright/test'
import { attemptOf } from '../helpers/attempt'
import { expect, test } from '../helpers/e2e-test'
import { createOwnFoodType } from '../helpers/own-food-type'
import { expectAccessibleLayout } from '../helpers/page-checks'

const USE_BY_HINT = 'Verbrauchsdatum überschritten, bitte nicht mehr essen.'
const DAY_MS = 24 * 60 * 60 * 1000

/** Gestern in deutscher Zeit als „TT.MM.JJJJ“: abgelaufen, aber nicht weit zurück. */
const yesterdayInBerlin = () =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.now() - DAY_MS))

const bestBefore = (page: Page) => page.getByLabel('Mindestens haltbar bis')
const content = (page: Page) => page.getByLabel('Inhalt je Packung')
const form = (page: Page) => page.getByRole('form', { name: 'Produkt erfassen' })

async function expectAccessibleInBothSchemes(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await expectAccessibleLayout(page)
  }
}

/** Eigene Art je Versuch anlegen und im Formular wählen. */
async function startWithOwnFoodType(page: Page, testInfo: TestInfo, prefix: string) {
  const name = `${prefix} ${String(attemptOf(testInfo))}`
  await createOwnFoodType(page, 'Mehl, Grieß und Stärke', name)
  await page.goto('/neu/manuell')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill(name)
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
  await expect(page.getByRole('button', { name: 'Lebensmittelart ändern' })).toBeVisible()
  return name
}

test('„zu verbrauchen bis“ wird ein Verbrauchsdatum, ohne „Noch gut“', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
  const date = yesterdayInBerlin()
  const name = await startWithOwnFoodType(page, testInfo, 'Verbrauchsmehl')
  await content(page).fill('250 g')
  await bestBefore(page).fill(`zu verbrauchen bis ${date}`)
  await bestBefore(page).press('Enter')

  await expect(
    form(page).getByRole('status').filter({ hasText: 'Verbrauchsdatum erkannt' }),
  ).toBeVisible()
  const dates = form(page).getByRole('list', { name: 'MHD und Anzahl' })
  await expect(dates.getByRole('listitem')).toHaveText([
    new RegExp(`${date} \\(Verbrauchsdatum\\).*1×`),
  ])
  await expectAccessibleInBothSchemes(page)
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()

  // Bald fällig: unter „Abgelaufen“ mit klarem Hinweis, ohne „Noch gut“
  await page.goto('/uebersicht/bald-faellig')
  const entry = page.getByRole('link', { name: `× ${name}` })
  await expect(entry).toContainText(USE_BY_HINT)
  await expect(page.getByRole('button', { name: `1 Packung ${name} entsorgt` })).toBeVisible()
  await expect(page.getByRole('button', { name: `${name} noch gut` })).toHaveCount(0)
  await expectAccessibleInBothSchemes(page)

  // Detail: Die Datumszeile sagt „Verbrauchsdatum“, das Blatt warnt und bietet kein „Noch gut“
  await page.goto((await entry.getAttribute('href')) ?? '')
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  const dateRow = page.getByRole('button', { name: new RegExp(`^${date}`) })
  await expect(dateRow).toContainText('Verbrauchsdatum')
  await dateRow.click()
  const sheet = page.getByRole('dialog', { name: `${name} · ${date}` })
  await expect(sheet).toContainText(USE_BY_HINT)
  await expect(sheet).not.toContainText('MHD ist kein Wegwerfdatum')
  await expect(sheet.getByRole('button', { name: 'Noch gut' })).toHaveCount(0)
  await expectAccessibleInBothSchemes(page)
})

test('unplausible Packungsmenge zeigt „bitte prüfen“ und lässt sich speichern', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Ändert Daten, läuft nur auf Desktop')
  const name = await startWithOwnFoodType(page, testInfo, 'Prüfmehl')

  await content(page).fill('1.500 l')
  await expect(content(page)).toHaveAccessibleDescription(
    /Ungewöhnlich viel für eine Packung\. Bitte prüft den Inhalt\./,
  )
  await expect(content(page)).not.toHaveAttribute('aria-invalid', 'true')
  await expectAccessibleInBothSchemes(page)

  // Gespeichert wird eine kleine Menge, damit die Vorratstage anderer Tests gleich bleiben
  await content(page).fill('0,5 g')
  await expect(content(page)).toHaveAccessibleDescription(/Ungewöhnlich wenig für eine Packung/)
  await page.getByRole('button', { name: 'Datum fehlt' }).click()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText(`1 Packung ${name} hinzugefügt.`)).toBeVisible()
})
