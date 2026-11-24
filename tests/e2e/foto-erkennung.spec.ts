import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectRequiredFieldError } from '../helpers/field-errors'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Foto-Erkennung in den Einstellungen (#108, #79). Die E2E-Tests laufen mit AI_PROVIDER=fake: Der
// Test-Anbieter antwortet ohne Netz, jeder Schlüssel ist erfunden. Verbindungen gelten für den
// ganzen Haushalt, deshalb ändert nur das Projekt „desktop“ etwas und räumt danach auf. Den
// Haushaltsschalter prüft foto-erkennung-schalter.spec.ts im Projekt „foto“.

// Erfunden, nur in der Form eines Anthropic-Schlüssels
const INVENTED_KEY = `sk-ant-e2e-erfunden-${'x'.repeat(40)}-e2e9`

const onlyOnDesktop = (projectName: string) => {
  test.skip(projectName !== 'desktop', 'Ändert den ganzen Haushalt, läuft nur auf Desktop')
}

const connectionSection = (page: Page, name: string) =>
  page.getByRole('region', { name, exact: true })

async function removeConnection(page: Page, name: string) {
  await connectionSection(page, name).getByRole('button', { name: 'Entfernen' }).click()
  const sheet = page.getByRole('dialog', { name: `${name} entfernen?` })
  await expectAccessibleLayout(page)
  await sheet.getByRole('button', { name: 'Entfernen' }).click()
  await expect(connectionSection(page, name)).toHaveCount(0)
}

// Ein abgebrochener erster Versuch lässt die Verbindung stehen, ein Retry hinge sonst an ihr
// („Diesen Namen gibt es schon.“)
async function removeLeftoverConnection(page: Page, name: string) {
  await waitForHydration(page)
  if ((await connectionSection(page, name).count()) > 0) await removeConnection(page, name)
}

test('zeigt dem Admin Status, Schalter und den Test-Anbieter', async ({ page }) => {
  await page.goto('/einstellungen')
  await page.getByRole('link', { name: /Foto-Erkennung/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Foto-Erkennung' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Foto-Erkennung' })).toBeVisible()
  await expect(
    page.getByText('Fotos werden zur Erkennung an Anthropic (USA) gesendet.'),
  ).toBeVisible()
  await expect(page.getByText('Test-Anbieter ohne Netz')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Konsole von Anthropic' })).toHaveAttribute(
    'href',
    'https://platform.claude.com/settings/keys',
  )
  await expectAccessibleLayout(page)
})

test('Verbindung anlegen, testen, Modell wählen und entfernen', async ({ page }, info) => {
  onlyOnDesktop(info.project.name)
  const name = 'E2E Anthropic'
  await page.goto('/einstellungen/foto-erkennung')
  await removeLeftoverConnection(page, name)

  // Ein falscher Schlüssel bleibt am Feld hängen und wird nicht wiederholt
  await page.getByLabel('Name', { exact: true }).fill(name)
  const keyField = page.getByLabel('API-Schlüssel von Anthropic')
  await expect(keyField).toHaveAttribute('type', 'password')
  await keyField.fill('sk-ant-zu-kurz')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(keyField).toHaveAccessibleDescription(/Der Schlüssel ist zu kurz/)
  await expect(page.getByText('sk-ant-zu-kurz')).toHaveCount(0)

  await keyField.fill(INVENTED_KEY)
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(page.getByText('Gespeichert. Der Schlüssel endet auf …e2e9.')).toBeVisible()
  await expect(keyField).toHaveValue('')

  const section = connectionSection(page, name)
  await expect(section).toContainText('gespeichert · endet auf e2e9')
  await expect(section).toContainText('noch nicht getestet')
  expect(await page.content()).not.toContain(INVENTED_KEY)
  await expectAccessibleLayout(page)

  // Leer ersetzen: Fehler am Feld im Blatt, keine Sprechblase des Browsers (#286)
  await section.getByRole('button', { name: 'Schlüssel ersetzen' }).click()
  const replaceSheet = page.getByRole('dialog', { name: `Schlüssel für ${name} ersetzen` })
  await replaceSheet.getByRole('button', { name: 'Ersetzen' }).click()
  await expectRequiredFieldError(
    replaceSheet.getByLabel('Neuer API-Schlüssel'),
    'Bitte den Schlüssel einfügen.',
  )
  await replaceSheet.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(replaceSheet).toBeHidden()

  await section.getByRole('button', { name: 'Verbindung testen' }).click()
  await expect(section.getByText('Die Verbindung funktioniert.')).toBeVisible()
  await expect(section).toContainText('funktioniert ·')

  // Modell für die Verpackung umstellen und wieder auf die Empfehlung setzen
  const packaging = page.getByRole('group', { name: 'Modell für Verpackung' })
  await packaging.getByText('Sonnet 5.5', { exact: true }).click()
  await page.getByRole('button', { name: 'Speichern' }).last().click()
  await expect(page.getByText('Gespeichert.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(packaging.getByRole('radio', { name: 'Sonnet 5.5' })).toBeChecked()
  await expect(page.getByText('Empfohlen: Haiku 5.5. Ihr weicht davon ab.')).toBeVisible()
  await page.getByRole('button', { name: 'Auf Empfehlung zurücksetzen' }).click()
  await expect(page.getByText('Alle Modelle stehen wieder auf der Empfehlung.')).toBeVisible()
  await page.reload()
  await expect(packaging.getByRole('radio', { name: 'Haiku 5.5 · empfohlen' })).toBeChecked()

  await removeConnection(page, name)
})
