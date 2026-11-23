import type { Page } from '@playwright/test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Nachkaufen (#72 bis #74, #200, #202). Der Beispielhaushalt hat ein Ziel mit Datum, also Lücken
// bis zum Ziel, Packungen, die vorher ablaufen (Vorschläge unter „Ersetzen“), und einen eigenen
// Eintrag „Mineralwasser“. Tests, die die Liste oder den Vorrat ändern, laufen nur im Projekt
// „desktop“ und stellen danach alles zurück (vorrat-entnehmen.spec.ts nimmt dort Linsen, Nudeln und
// Thunfisch, hier deshalb H-Milch, Haferflocken und eigene Namen).

function onlyDesktop(projectName: string) {
  test.skip(projectName !== 'desktop', 'Ändert den Beispielhaushalt, läuft nur auf Desktop')
}

const list = (page: Page, name: string) => page.getByRole('list', { name })

const undoBar = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text })

async function removeEntry(page: Page, label: string) {
  await page.getByRole('button', { name: `${label} entfernen` }).click()
  await expect(page.getByRole('checkbox', { name: label })).toHaveCount(0)
}

test('zeigt die Lücken bis zum Ziel und die eigenen Einträge', async ({ page }) => {
  await page.goto('/nachkaufen')

  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible()
  await expect(page.getByText(/^\d+ offen$/)).toBeVisible()
  const gaps = list(page, 'Fehlt bis zum Ziel')
  // Wasser zuerst, in ganzen Litern
  await expect(gaps.getByRole('listitem').first()).toHaveText(/^Wasser.*von 10 Tagen.*\d+ l$/)
  // Beispiele aus den Lebensmittelarten, die der Haushalt im Vorrat hat, zuerst
  await expect(gaps.getByRole('listitem').first()).toContainText('z. B. Sprudelwasser')
  await expect(
    list(page, 'Ersetzen')
      .getByRole('button', { name: /^Auf die Liste\s+für / })
      .first(),
  ).toBeVisible()
  await expect(
    list(page, 'Eigene Einträge').getByRole('checkbox', { name: 'Mineralwasser' }),
  ).not.toBeChecked()
  await expect(page.getByLabel('Eintrag ergänzen')).toBeVisible()
  await expectAccessibleLayout(page)
})

test('ergänzt, hakt ab mit Rückgängig und „Jetzt erfassen“, entfernt', async ({ page }, info) => {
  onlyDesktop(info.project.name)
  await page.goto('/nachkaufen')

  await page.getByLabel('Eintrag ergänzen').fill('Knäckebrot')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  const entry = list(page, 'Eigene Einträge').getByRole('checkbox', { name: 'Knäckebrot' })
  await expect(entry).not.toBeChecked()
  await expect(page.getByLabel('Eintrag ergänzen')).toHaveValue('')

  await entry.click()
  const bar = undoBar(page, 'Knäckebrot abgehakt.')
  await expect(bar).toBeVisible()
  const done = list(page, 'Erledigt').getByRole('checkbox', { name: 'Knäckebrot' })
  await expect(done).toBeChecked()
  await expectAccessibleLayout(page)

  await bar.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entry).not.toBeChecked()

  await entry.click()
  await undoBar(page, 'Knäckebrot abgehakt.')
    .getByRole('button', { name: 'Jetzt erfassen' })
    .click()
  await expect(page).toHaveURL(/\/neu/, { timeout: 15_000 })

  await page.goto('/nachkaufen')
  await expect(done).toBeChecked()
  await removeEntry(page, 'Knäckebrot')
})

test('zeigt einen Fehler am Feld, wenn der Eintrag leer ist', async ({ page }) => {
  await page.goto('/nachkaufen')
  const field = page.getByLabel('Eintrag ergänzen')
  await field.fill('   ')

  await page.getByRole('button', { name: 'Hinzufügen' }).click()

  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Bitte tragt ein, was auf die Liste soll.').first()).toBeVisible()
})

test('setzt nach „−1“ mit einem Tipp auf die Liste, Rückgängig nimmt es mit', async ({
  page,
}, info) => {
  onlyDesktop(info.project.name)
  await page.goto('/vorrat/milch')

  await page.getByRole('button', { name: '1 Packung H-Milch entnehmen' }).click()
  const bar = undoBar(page, 'H-Milch: 1 Packung verbraucht')
  await bar.getByRole('button', { name: 'Nachkaufen' }).click()

  const listed = undoBar(page, 'H-Milch steht jetzt auf der Nachkaufen-Liste.')
  await expect(listed).toBeVisible()
  await expect(listed.getByRole('button', { name: 'Nachkaufen' })).toHaveCount(0)
  await listed.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(listed).toHaveCount(0)

  await expect(page.getByRole('button', { name: '1 Packung H-Milch entnehmen' })).toBeEnabled()

  await page.goto('/nachkaufen')
  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'H-Milch' })).toHaveCount(0)
})

test('setzt einen Vorschlag auf die Liste, Entfernen hat Rückgängig', async ({ page }, info) => {
  onlyDesktop(info.project.name)
  // Viele Schritte nacheinander, jeder lädt die Liste neu
  test.slow()
  await page.goto('/nachkaufen')
  const replace = list(page, 'Ersetzen')
  const suggestion = replace.getByRole('button', { name: /^Auf die Liste\s+für Haferflocken$/ })
  const entry = replace.getByRole('checkbox', { name: 'Haferflocken' })

  await suggestion.click()
  const listed = undoBar(page, 'Haferflocken steht jetzt auf der Liste.')
  await expect(listed).toBeVisible()
  await expect(entry).not.toBeChecked()
  await expect(suggestion).toHaveCount(0)

  await listed.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entry).toHaveCount(0)
  await expect(suggestion).toBeVisible()

  await suggestion.click()
  await expect(entry).toBeVisible()
  await page.getByRole('button', { name: 'Haferflocken entfernen' }).click()
  const removed = undoBar(page, 'Haferflocken entfernt.')
  await expect(removed).toBeVisible()
  await expect(entry).toHaveCount(0)

  await removed.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entry).toBeVisible()

  await removeEntry(page, 'Haferflocken')
  await expect(suggestion).toBeVisible()
  await expectAccessibleLayout(page)
})

test.describe('zwei Nutzer im selben Haushalt', () => {
  test('ein Mitglied sieht, was der Admin abgehakt hat, und umgekehrt', async ({
    page,
    browser,
    baseURL,
  }, info) => {
    onlyDesktop(info.project.name)
    // Zwei Sitzungen nacheinander, dazu eine Anmeldung über die Oberfläche
    test.slow()
    await page.goto('/nachkaufen')
    await page.getByLabel('Eintrag ergänzen').fill('Zwieback')
    await page.getByRole('button', { name: 'Hinzufügen' }).click()
    await list(page, 'Eigene Einträge').getByRole('checkbox', { name: 'Zwieback' }).click()
    await expect(list(page, 'Erledigt').getByRole('checkbox', { name: 'Zwieback' })).toBeChecked()

    // Eigener Browser-Kontext: Das Mitglied ist gleichzeitig angemeldet, der Admin bleibt es auch
    const memberContext = await browser.newContext({
      ...(baseURL === undefined ? {} : { baseURL }),
      locale: 'de-DE',
      ...signedOut,
    })
    const memberPage = await memberContext.newPage()
    await signInViaUi(memberPage, E2E_MEMBER)
    await memberPage.goto('/nachkaufen')
    const memberDone = list(memberPage, 'Erledigt').getByRole('checkbox', { name: 'Zwieback' })
    await expect(memberDone).toBeChecked()
    await memberDone.click()
    await expect(
      list(memberPage, 'Eigene Einträge').getByRole('checkbox', { name: 'Zwieback' }),
    ).not.toBeChecked()
    await memberContext.close()

    await page.reload()
    await expect(
      list(page, 'Eigene Einträge').getByRole('checkbox', { name: 'Zwieback' }),
    ).not.toBeChecked()
    await removeEntry(page, 'Zwieback')
  })
})
