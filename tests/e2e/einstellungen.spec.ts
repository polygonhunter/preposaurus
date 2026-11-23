import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Einstellungen als Admin (#37, #38, #39, #117). Alle Projekte teilen sich einen Haushalt: Jede
// Person trägt deshalb den Namen des Projekts, und Einstellungen des ganzen Haushalts ändert nur
// das Projekt „desktop“ und stellt sie danach zurück.

const onlyOnDesktop = (projectName: string) => {
  test.skip(projectName !== 'desktop', 'Ändert den ganzen Haushalt, läuft nur auf Desktop')
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Speichern' })

test('zeigt dem Admin alle vier Gruppen', async ({ page }) => {
  await page.goto('/einstellungen')

  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible()
  for (const group of ['Mein Konto', 'Haushalt', 'Nutzerverwaltung', 'Daten & System']) {
    await expect(page.getByRole('heading', { level: 2, name: group })).toBeVisible()
  }
  await expectAccessibleLayout(page)

  await page.getByRole('link', { name: /Nutzer und Anmeldung/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nutzer' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Wer sich anmelden kann' })).toContainText(
    'testadmin',
  )
  await expectAccessibleLayout(page)

  await page.goto('/einstellungen/system')
  await expect(page.getByText('AGPL-3.0-or-later')).toBeVisible()
  await expectAccessibleLayout(page)
})

test('Person anlegen, bearbeiten und entfernen', async ({ page }, info) => {
  const name = `Testperson ${info.project.name}`
  await page.goto('/einstellungen/mitglieder')
  await expectAccessibleLayout(page)
  await page.getByRole('link', { name: 'Hinzufügen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Person hinzufügen' })).toBeVisible()

  await page.getByLabel('Name').fill(name)
  await page.getByText('Baby', { exact: true }).click()
  await page.getByLabel('Geburtsjahr').fill('2026')
  await saveButton(page).click()

  // Fehler am Feld, der Fokus springt hin, die übrigen Eingaben bleiben
  const month = page.getByLabel('Geburtsmonat')
  await expect(month).toHaveAccessibleDescription(/Bei Babys bitte auch den Monat eintragen\./)
  await expect(month).toBeFocused()
  await expect(page.getByLabel('Name')).toHaveValue(name)
  await expectAccessibleLayout(page)

  await month.fill('2')
  await page.getByText('Weitere Angaben (freiwillig)').click()
  await page.getByLabel('Allergien und Unverträglichkeiten').fill('Laktose')
  await saveButton(page).click()

  await expect(page).toHaveURL(/\/einstellungen\/mitglieder$/)
  const row = page.getByRole('link', { name: new RegExp(name) })
  await expect(row).toContainText('Baby · 02/2026')
  await expect(row).toContainText('Laktose')

  // Bleibt ein Baby: Babys zählen nicht im Bedarf, die Übersicht-Tests laufen parallel weiter
  await row.click()
  await page.getByLabel('Geburtsmonat').fill('3')
  await page.getByText('Vegan', { exact: true }).click()
  await saveButton(page).click()
  await expect(row).toContainText('Baby · 03/2026 · vegan')

  await row.click()
  await page.getByRole('button', { name: 'Person entfernen' }).click()
  const sheet = page.getByRole('dialog', { name: `${name} entfernen?` })
  await expect(sheet).toBeVisible()
  await expectAccessibleLayout(page)
  await sheet.getByRole('button', { name: 'Entfernen' }).click()
  await expect(page).toHaveURL(/\/einstellungen\/mitglieder$/)
  await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)
})

test('ein Zieldatum in der Vergangenheit wird nicht gespeichert', async ({ page }) => {
  await page.goto('/einstellungen/ziel')
  await expect(page.getByRole('heading', { level: 1, name: 'Ziel und Empfehlung' })).toBeVisible()
  await expect(page.getByText('Rechenmodus')).toBeVisible()
  await expectAccessibleLayout(page)

  const date = page.getByLabel('Bis wann? (freiwillig)')
  await date.fill('2020-01-31')
  await saveButton(page).click()

  await expect(date).toHaveAccessibleDescription(
    /Dieses Datum ist schon vorbei\. Magst du ein neues wählen\?/,
  )
  await expect(date).toBeFocused()
  // Erst prüfen, wenn der Knopf nach dem Laden wieder voll sichtbar ist (Übergang 150 ms)
  await expect(saveButton(page)).toHaveCSS('opacity', '1')
  await expectAccessibleLayout(page)
})

test('Zieldauer und Zieldatum ändern', async ({ page }, info) => {
  onlyOnDesktop(info.project.name)
  await page.goto('/einstellungen/ziel')
  // Der Beispielvorrat setzt ein Zieldatum, auf das sich die Übersicht-Tests verlassen
  const dateField = page.getByLabel('Bis wann? (freiwillig)')
  const originalDate = await dateField.inputValue()

  await page.getByText('Eigener Wert').click()
  const custom = page.getByLabel('Eigene Dauer in Tagen')
  await custom.fill('400')
  await saveButton(page).click()
  await expect(custom).toHaveAccessibleDescription(/Bitte eine Zahl von 1 bis 365 eintragen\./)

  await custom.fill('21')
  await dateField.fill('2099-12-31')
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Eigene Dauer in Tagen')).toHaveValue('21')
  await expect(dateField).toHaveValue('2099-12-31')

  await page.getByText('10 Tage', { exact: true }).click()
  await dateField.fill(originalDate)
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
})

test('Ernährung des Haushalts und „Noch gut zählt mit“ umstellen', async ({ page }, info) => {
  onlyOnDesktop(info.project.name)
  await page.goto('/einstellungen/regeln')
  const toggle = page.getByRole('switch', { name: '„Noch gut“ zählt mit' })
  await expect(toggle).not.toBeChecked()
  await expectAccessibleLayout(page)

  // Der Schalter ist eine versteckte Checkbox, getippt wird auf seine Beschriftung
  const label = page.getByText('„Noch gut“ zählt mit', { exact: true })
  await label.click()
  await expect(toggle).toBeChecked()
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
  await page.reload()
  await expect(toggle).toBeChecked()
  await label.click()
  await expect(toggle).not.toBeChecked()
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()

  await page.goto('/einstellungen/mitglieder')
  await page.getByText('Vegetarisch', { exact: true }).click()
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Vegetarisch' })).toBeChecked()
  await page.getByText('Alles', { exact: true }).click()
  await saveButton(page).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
})
