// Stammdaten als Admin (#77, #78, #76, #126): Lagerorte, Ampel-Schwellen, Kategorien und
// Lebensmittelarten. Alle Projekte teilen sich einen
// Haushalt, deshalb ändert nur das Projekt „desktop“ etwas und stellt es danach wieder her.
import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const onlyOnDesktop = (projectName: string) => {
  test.skip(projectName !== 'desktop', 'Ändert den ganzen Haushalt, läuft nur auf Desktop')
}

const locationChoice = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Lagerort' }).getByRole('button', { name, exact: true })

test('Lagerort anlegen, beim Erfassen finden, umbenennen, ausblenden und löschen', async ({
  page,
}, info) => {
  onlyOnDesktop(info.project.name)
  await page.goto('/einstellungen')
  await page.getByRole('link', { name: /Lagerorte/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lagerorte' })).toBeVisible()
  await expectAccessibleLayout(page)

  const nameField = page.getByLabel('Name, z. B. Keller oder Vorratsschrank')
  await nameField.fill('keller')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(nameField).toHaveAccessibleDescription('Diesen Lagerort gibt es schon.')
  await expect(nameField).toBeFocused()

  await nameField.fill('Speisekammer')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(page.getByText('„Speisekammer“ ist angelegt.')).toBeVisible()
  const visible = page.getByRole('list', { name: 'Zur Wahl beim Erfassen' })
  await expect(visible.getByRole('listitem').last()).toContainText('Speisekammer')
  await page.getByRole('button', { name: 'Speisekammer nach oben' }).click()
  await expect(visible.getByRole('listitem').last()).not.toContainText('Speisekammer')
  await expectAccessibleLayout(page)

  await page.goto('/neu/manuell')
  await expect(locationChoice(page, 'Speisekammer')).toBeVisible()

  await page.goto('/einstellungen/lagerorte')
  await page.getByRole('link', { name: /Speisekammer/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Speisekammer' })).toBeVisible()
  await expectAccessibleLayout(page)
  await page.getByLabel('Name des Lagerorts').fill('Speisekammer oben')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page).toHaveURL(/\/einstellungen\/lagerorte$/)

  await page.getByRole('link', { name: /Speisekammer oben/ }).click()
  await page.getByRole('button', { name: 'Ausblenden' }).click()
  await expect(page.getByRole('button', { name: 'Wieder einblenden' })).toBeVisible()
  await page.goto('/einstellungen/lagerorte')
  await expect(page.getByRole('list', { name: 'Ausgeblendet' })).toContainText('Speisekammer oben')
  await page.goto('/neu/manuell')
  await expect(locationChoice(page, 'Keller')).toBeVisible()
  await expect(locationChoice(page, 'Speisekammer oben')).toHaveCount(0)

  await page.goto('/einstellungen/lagerorte')
  await page.getByRole('link', { name: /Speisekammer oben/ }).click()
  await page.getByRole('button', { name: 'Lagerort löschen' }).click()
  const sheet = page.getByRole('dialog', { name: '„Speisekammer oben“ löschen?' })
  await expect(sheet).toBeVisible()
  await expectAccessibleLayout(page)
  await sheet.getByRole('button', { name: 'Löschen' }).click()
  await expect(page).toHaveURL(/\/einstellungen\/lagerorte$/)
  await expect(page.getByRole('link', { name: /Speisekammer/ })).toHaveCount(0)
})

test('ein benutzter Lagerort lässt sich nur ausblenden, nicht löschen', async ({ page }) => {
  await page.goto('/einstellungen/lagerorte')
  await page.getByRole('link', { name: /^Keller/ }).click()

  await expect(page.getByRole('button', { name: 'Ausblenden' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lagerort löschen' })).toHaveCount(0)
  await expect(page.getByText(/Löschen geht nur, wenn hier kein Produkt liegt/)).toBeVisible()
  await expectAccessibleLayout(page)
})

test('Ampel-Schwellen: Orange nie größer als Gelb und mindestens 7 Tage', async ({ page }) => {
  await page.goto('/einstellungen/regeln')
  const ampel = page.getByRole('form', { name: 'Ampel' })
  const yellow = ampel.getByLabel('Gelb, bald fällig: Tage vor dem MHD')
  const orange = ampel.getByLabel('Orange, dringend: Tage vor dem MHD')
  await expect(yellow).toHaveValue('90')
  await expect(orange).toHaveValue('28')
  await expectAccessibleLayout(page)

  await orange.fill('120')
  await ampel.getByRole('button', { name: 'Speichern' }).click()
  await expect(orange).toHaveAccessibleDescription(/Orange kommt nach Gelb/)
  await expect(orange).toBeFocused()

  await orange.fill('6')
  await ampel.getByRole('button', { name: 'Speichern' }).click()
  await expect(orange).toHaveAccessibleDescription(/Bitte mindestens 7 Tage/)
  await expect(ampel.getByRole('button', { name: 'Speichern' })).toHaveCSS('opacity', '1')
  await expectAccessibleLayout(page)
})

test('Ampel-Schwellen speichern', async ({ page }, info) => {
  onlyOnDesktop(info.project.name)
  await page.goto('/einstellungen/regeln')
  const ampel = page.getByRole('form', { name: 'Ampel' })
  // Gespeichert werden die Standardwerte: Andere Tests lesen parallel die Überschriften der Ampel
  await ampel.getByLabel('Gelb, bald fällig: Tage vor dem MHD').fill('90')
  await ampel.getByLabel('Orange, dringend: Tage vor dem MHD').fill('28')
  await ampel.getByRole('button', { name: 'Speichern' }).click()

  await expect(ampel.getByText('Gespeichert.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Orange, dringend: Tage vor dem MHD')).toHaveValue('28')
})

const captureSearch = (page: Page) =>
  page.getByRole('searchbox', { name: 'Lebensmittelart suchen' })

test('eigene Kategorie und Art anlegen, beim Erfassen finden, ausblenden und löschen', async ({
  page,
}, info) => {
  onlyOnDesktop(info.project.name)
  await page.goto('/einstellungen')
  await page.getByRole('link', { name: /Kategorien und Lebensmittelarten/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Kategorien' })).toBeVisible()
  await expectAccessibleLayout(page)

  await page.getByRole('link', { name: 'Neue Kategorie' }).click()
  await page.getByLabel('Name der Kategorie').fill('Testvorräte')
  await page.getByText('Sonstiges', { exact: true }).click()
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Testvorräte' })).toBeVisible()
  await expectAccessibleLayout(page)

  // Ohne Kategorie: Fehler an der Wahl, der Fokus springt hin
  await page.goto('/einstellungen/lebensmittelarten/neu')
  await page.getByLabel('Name der Lebensmittelart').fill('Dinkelpops')
  await page.getByRole('button', { name: 'Anlegen' }).click()
  const picker = page.getByRole('button', { name: /^Kategorie/ })
  await expect(picker).toHaveAccessibleDescription('Bitte eine Kategorie wählen.')
  await expect(picker).toBeFocused()

  await picker.click()
  const sheet = page.getByRole('dialog', { name: 'Kategorie wählen' })
  await sheet.getByRole('searchbox', { name: 'Kategorie suchen' }).fill('testvor')
  await expectAccessibleLayout(page)
  await sheet.getByRole('button', { name: /Testvorräte/ }).click()
  await expect(picker).toContainText('Sonstiges › Testvorräte')
  await page.getByLabel('Suchwörter (freiwillig)').fill('Frühstücksknusper, Pops')
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Dinkelpops' })).toBeVisible()
  await expectAccessibleLayout(page)

  await page.goto('/neu/manuell')
  await captureSearch(page).fill('knusper')
  await expect(page.getByRole('button', { name: /^Dinkelpops/ })).toBeVisible()

  await page.goto('/einstellungen/lebensmittelarten?suche=dinkelpops')
  await page
    .getByRole('link', { name: /Dinkelpops/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Ausblenden' }).click()
  await expect(page.getByRole('button', { name: 'Wieder einblenden' })).toBeVisible()
  await page.goto('/neu/manuell')
  await captureSearch(page).fill('knusper')
  await expect(page.getByRole('button', { name: /^Dinkelpops/ })).toHaveCount(0)

  await page.goto('/einstellungen/lebensmittelarten?suche=dinkelpops')
  await page
    .getByRole('link', { name: /Dinkelpops/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Lebensmittelart löschen' }).click()
  await page
    .getByRole('dialog', { name: '„Dinkelpops“ löschen?' })
    .getByRole('button', { name: 'Löschen' })
    .click()
  await expect(page).toHaveURL(/\/einstellungen\/lebensmittelarten$/)

  await page.goto('/einstellungen/kategorien')
  await page.getByRole('link', { name: /Testvorräte/ }).click()
  await page.getByRole('button', { name: 'Kategorie löschen' }).click()
  await page
    .getByRole('dialog', { name: '„Testvorräte“ löschen?' })
    .getByRole('button', { name: 'Löschen' })
    .click()
  await expect(page).toHaveURL(/\/einstellungen\/kategorien$/)
  await expect(page.getByRole('link', { name: /Testvorräte/ })).toHaveCount(0)
})

test('Arten der Startliste lassen sich suchen und nur ausblenden', async ({ page }) => {
  await page.goto('/einstellungen/lebensmittelarten')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).fill('Hirse')
  await page.getByRole('searchbox', { name: 'Lebensmittelart suchen' }).press('Enter')
  await expect(page).toHaveURL(/suche=Hirse/)
  await expectAccessibleLayout(page)
  await page
    .getByRole('list', { name: 'Treffer' })
    .getByRole('link', { name: /^Hirse/ })
    .click()

  await expect(page.getByText('Arten der Startliste lassen sich nur ausblenden.')).toBeVisible()
  await expect(page.getByLabel('Name der Lebensmittelart')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ausblenden' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lebensmittelart löschen' })).toHaveCount(0)
  await expectAccessibleLayout(page)
})
