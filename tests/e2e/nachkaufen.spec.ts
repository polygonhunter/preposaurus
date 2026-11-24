import type { Page } from '@playwright/test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { neighbourCheckboxName } from '../helpers/focus-rows'
import { expectNotice, noticeBar } from '../helpers/notice-bar'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Nachkaufen (#72 bis #74, #200 bis #202). Der Beispielhaushalt hat ein Ziel mit Datum, also Lücken
// bis zum Ziel, Packungen, die vorher ablaufen (Vorschläge unter „Ersetzen“), und einen eigenen
// Eintrag „Mineralwasser“. Tests, die die Liste oder den Vorrat ändern, laufen nur im Projekt
// „desktop“ und stellen danach alles zurück (vorrat-entnehmen.spec.ts nimmt dort Linsen, Nudeln und
// Thunfisch, hier deshalb H-Milch, Haferflocken und eigene Namen).

function onlyDesktop(projectName: string) {
  test.skip(projectName !== 'desktop', 'Ändert den Beispielhaushalt, läuft nur auf Desktop')
}

const list = (page: Page, name: string) => page.getByRole('list', { name })

const undoButton = (page: Page, text: string) =>
  noticeBar(page, text).getByRole('button', { name: 'Rückgängig' })

// Der Fokus ist nach einer Handlung per Tastatur noch auf der Seite, nicht auf body (#269)
const focusIn = (page: Page, name: string) => list(page, name).locator(':focus')

async function removeEntry(page: Page, label: string) {
  await page.getByRole('button', { name: `${label} entfernen` }).click()
  await expect(page.getByRole('checkbox', { name: label })).toHaveCount(0)
}

test('zeigt die Lücken bis zum Ziel und die eigenen Einträge', async ({ page }) => {
  await page.goto('/nachkaufen')

  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible()
  // Offene Einträge wie auf der Übersicht, Vorschläge und Lücken eigens genannt (#202)
  await expect(
    page.getByText(
      /^\d+ (Eintrag|Einträge) offen( · \d+ (Vorschlag|Vorschläge))? · \d+ Warengruppen? unter dem Ziel$/,
    ),
  ).toBeVisible()
  const gaps = list(page, 'Fehlt bis zum Ziel')
  // Wasser zuerst, in ganzen Litern
  await expect(gaps.getByRole('listitem').first()).toHaveText(
    /^Wasser.*von 10 Tagen.*\d+ l\s*Ausblenden\s+Wasser$/,
  )
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
  const bar = noticeBar(page, 'Knäckebrot abgehakt.')
  const done = list(page, 'Erledigt').getByRole('checkbox', { name: 'Knäckebrot' })
  await expect(done).toBeChecked()
  await expectNotice(page, 'Knäckebrot abgehakt.')
  // Die Zeile schließt nach fünf Sekunden: erst „Rückgängig“, axe danach mit offener Zeile, wenn
  // nichts mehr auf sie wartet (sonst kann ein langsamer axe-Lauf sie überdauern)
  await bar.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(entry).not.toBeChecked()

  await entry.click()
  await noticeBar(page, 'Knäckebrot abgehakt.')
    .getByRole('button', { name: 'Jetzt erfassen' })
    .click()
  await expect(page).toHaveURL(/\/neu/, { timeout: 15_000 })

  await page.goto('/nachkaufen')
  await expect(done).toBeChecked()
  await removeEntry(page, 'Knäckebrot')
  await expectNotice(page, 'Knäckebrot entfernt.')
  await expectAccessibleLayout(page)
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
  const bar = noticeBar(page, 'H-Milch: 1 Packung verbraucht')
  await bar.getByRole('button', { name: 'Nachkaufen' }).click()

  const listed = noticeBar(page, 'H-Milch steht jetzt auf der Nachkaufen-Liste.')
  await expectNotice(page, 'H-Milch steht jetzt auf der Nachkaufen-Liste.')
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

  const remove = page.getByRole('button', { name: 'Haferflocken entfernen' })

  // Per Tastatur: Der Fokus bleibt in der Liste und kehrt mit „Rückgängig“ zurück (#269)
  await suggestion.press('Enter')
  const listed = 'Haferflocken steht jetzt auf der Liste.'
  await expectNotice(page, listed)
  await expect(entry).not.toBeChecked()
  await expect(suggestion).toHaveCount(0)
  await expect(focusIn(page, 'Ersetzen')).toHaveCount(1)

  await undoButton(page, listed).press('Enter')
  await expect(entry).toHaveCount(0)
  await expect(suggestion).toBeFocused()

  await suggestion.press('Enter')
  await expect(entry).toBeVisible()
  await remove.press('Enter')
  const removed = 'Haferflocken entfernt.'
  await expectNotice(page, removed)
  await expect(entry).toHaveCount(0)
  await expect(focusIn(page, 'Ersetzen')).toHaveCount(1)

  await undoButton(page, removed).press('Enter')
  await expect(entry).toBeVisible()
  await expect(remove).toBeFocused()

  await removeEntry(page, 'Haferflocken')
  await expect(suggestion).toBeVisible()
  await expectAccessibleLayout(page)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Lücken mit Haken und „Ausblenden“ sind barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/nachkaufen')
    const gaps = list(page, 'Fehlt bis zum Ziel')

    await expect(gaps.getByRole('checkbox', { name: 'Wasser' })).not.toBeChecked()
    await expect(gaps.getByRole('button', { name: /^Ausblenden\s+Wasser$/ })).toBeVisible()
    await expectAccessibleLayout(page)
  })
}

// Wasser bleibt unberührt, weil der erste Test auf allen Geräten gleichzeitig „Wasser zuerst“ prüft.
// Deshalb die letzte Lücke der Liste.
async function lastGapName(page: Page) {
  const name = await list(page, 'Fehlt bis zum Ziel')
    .getByRole('checkbox')
    .last()
    .getAttribute('aria-label')
  if (name === null || name === 'Wasser')
    throw new Error('Der Beispielhaushalt braucht eine zweite Lücke')
  return name
}

// Ein abgebrochener erster Versuch lässt seine Lücke ausgeblendet; der Retry holt sie zurück (#272)
async function showHiddenGaps(page: Page) {
  const show = list(page, 'Ausgeblendet').getByRole('button', { name: /^Wieder zeigen/ })
  while ((await show.count()) > 0) {
    const count = await show.count()
    await show.first().click()
    await expect(show).toHaveCount(count - 1)
  }
}

// Nur „… unter dem Ziel“: Die Zahl offener Einträge ändern parallele Tests (#272)
const GOAL_PART = /\d+ Warengruppen? unter dem Ziel$/

test('blendet eine Lücke aus und holt sie zurück, hakt sie ab und öffnet sie wieder', async ({
  page,
}, info) => {
  onlyDesktop(info.project.name)
  // Viele Schritte nacheinander, jeder lädt die Liste neu
  test.slow()
  await page.goto('/nachkaufen')
  await showHiddenGaps(page)
  const goalPart = (await page.getByText(GOAL_PART).textContent())?.match(GOAL_PART)?.[0]
  if (goalPart === undefined)
    throw new Error('Der Untertitel nennt die Warengruppen unter dem Ziel')
  const name = await lastGapName(page)
  const gaps = list(page, 'Fehlt bis zum Ziel')
  const gap = gaps.getByRole('checkbox', { name })
  // Die Lücke davor bekommt den Fokus, wenn die letzte geht (keine nächste Zeile, #269). Direkt
  // vor der Handlung gelesen, Entnahmen in parallelen Tests ändern die Lücken.
  const neighbour = async () =>
    gaps.getByRole('checkbox', { name: await neighbourCheckboxName(gap), exact: true })
  const hide = page.getByRole('button', { name: new RegExp(`^Ausblenden\\s+${name}$`) })
  const show = page.getByRole('button', { name: new RegExp(`^Wieder zeigen\\s+${name}$`) })

  const beforeHide = await neighbour()
  await hide.press('Enter')
  const hidden = noticeBar(page, `${name} ausgeblendet.`)
  await expectNotice(page, `${name} ausgeblendet.`)
  await expect(gap).toHaveCount(0)
  await expect(beforeHide).toBeFocused()
  await expect(list(page, 'Ausgeblendet').getByRole('listitem')).toContainText(name)
  // Unter dem Ziel bleibt die Warengruppe trotzdem, wie auf der Übersicht
  await expect(page.getByText(GOAL_PART)).toContainText(goalPart)
  await hidden.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(gap).toBeVisible()
  await expect(hide).toBeFocused()

  await hide.click()
  await expect(show).toBeVisible()
  await expect(
    page.getByText(/kommt von selbst zurück, wenn sie um mehr als 10 % wächst/),
  ).toBeVisible()
  await page.emulateMedia({ colorScheme: 'dark' })
  await expectAccessibleLayout(page)
  await page.emulateMedia({ colorScheme: 'light' })
  // Mit der letzten ausgeblendeten Lücke geht der Abschnitt: Fokus auf die Überschrift davor
  await show.press('Enter')
  await expect(gap).toBeVisible()
  await expect(show).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2 }).and(page.locator(':focus'))).toHaveCount(1)

  const beforeCheck = await neighbour()
  await gap.press('Space')
  const checked = noticeBar(page, `${name} abgehakt.`)
  const done = list(page, 'Erledigt').getByRole('checkbox', { name })
  await expect(done).toBeChecked()
  await expect(gap).toHaveCount(0)
  await expect(beforeCheck).toBeFocused()
  await expectNotice(page, `${name} abgehakt.`)
  await checked.getByRole('button', { name: 'Rückgängig' }).press('Enter')
  await expect(gap).toBeVisible()
  await expect(done).toHaveCount(0)
  await expect(gap).toBeFocused()

  await gap.click()
  await expect(done).toBeChecked()
  await expect(
    list(page, 'Erledigt').getByRole('listitem').filter({ hasText: name }),
  ).toContainText(/\d+(,\d)? (kg|g|l)/)
  await expectAccessibleLayout(page)
  await done.click()
  await expect(gap).toBeVisible()
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
