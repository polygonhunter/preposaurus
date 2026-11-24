import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { signedOut } from '../helpers/e2e-auth'
import { expectRequiredFieldError, formOf } from '../helpers/field-errors'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Leere Pflichtfelder (#286): Jedes Formular meldet sie ruhig am Feld, auf Deutsch, mit Fokus auf
// dem ersten fehlerhaften Feld, statt der Sprechblase des Browsers. Leer abschicken speichert
// nichts, deshalb laufen die Fälle in allen Projekten parallel auf dem gemeinsamen Haushalt.
// Die Ersteinrichtung prüft einrichtung.setup.ts, „Schlüssel ersetzen“ foto-erkennung.spec.ts.

type RequiredFieldCase = Readonly<{
  form: string
  path: string
  field: (page: Page) => Locator
  submit: string
  message: string | RegExp
  /** Vorher nötig, z. B. „Eigener Wert“ wählen, damit das Feld erscheint */
  prepare?: (page: Page) => Promise<void>
}>

const byLabel = (label: string) => (page: Page) => page.getByLabel(label, { exact: true })

const SIGNED_IN_CASES: readonly RequiredFieldCase[] = [
  {
    form: 'Nachkaufen, Eintrag ergänzen',
    path: '/nachkaufen',
    field: byLabel('Eintrag ergänzen'),
    submit: 'Hinzufügen',
    message: 'Bitte tragt ein, was auf die Liste soll.',
  },
  {
    form: 'Mein Konto, Profil',
    path: '/einstellungen/konto',
    field: byLabel('Anzeigename'),
    submit: 'Speichern',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'Mein Konto, Passwort ändern',
    path: '/einstellungen/konto',
    field: byLabel('Bisheriges Passwort'),
    submit: 'Passwort ändern',
    message: 'Bitte das bisherige Passwort eintragen.',
  },
  {
    form: 'Nutzer anlegen',
    path: '/einstellungen/nutzer/neu',
    field: byLabel('Anzeigename'),
    submit: 'Anlegen',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'Person hinzufügen',
    path: '/einstellungen/mitglieder/neu',
    field: byLabel('Name'),
    submit: 'Speichern',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'Ziel, eigene Dauer',
    path: '/einstellungen/ziel',
    field: byLabel('Eigene Dauer in Tagen'),
    submit: 'Speichern',
    message: /Bitte eine Zahl von 1 bis \d+ eintragen\.$/,
    prepare: async (page) => {
      await page.getByText('Eigener Wert', { exact: true }).click()
    },
  },
  {
    form: 'Ampel',
    path: '/einstellungen/regeln',
    field: byLabel('Gelb, bald fällig: Tage vor dem MHD'),
    submit: 'Speichern',
    message: 'Bitte ganze Tage von 1 bis 365 eintragen.',
  },
  {
    form: 'Erinnerungen',
    path: '/einstellungen/erinnerungen',
    field: byLabel('Uhrzeit'),
    submit: 'Speichern',
    message: 'Bitte eine Uhrzeit wie 10:00 eintragen.',
  },
  {
    form: 'Kategorie',
    path: '/einstellungen/kategorien/neu',
    field: byLabel('Name der Kategorie'),
    submit: 'Anlegen',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'Lebensmittelart',
    path: '/einstellungen/lebensmittelarten/neu',
    field: byLabel('Name der Lebensmittelart'),
    submit: 'Anlegen',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'Lagerort',
    path: '/einstellungen/lagerorte',
    field: byLabel('Name, z. B. Keller oder Vorratsschrank'),
    submit: 'Hinzufügen',
    message: 'Bitte einen Namen eintragen.',
  },
  {
    form: 'KI-Verbindung',
    path: '/einstellungen/foto-erkennung',
    field: byLabel('Name'),
    submit: 'Hinzufügen',
    message: 'Bitte einen Namen eintragen.',
  },
]

const COLOR_SCHEMES = ['light', 'dark'] as const

async function submitEmpty(page: Page, entry: RequiredFieldCase): Promise<Locator> {
  await page.goto(entry.path)
  await waitForHydration(page)
  await entry.prepare?.(page)
  const field = entry.field(page)
  await field.fill('')
  const submit = formOf(field).getByRole('button', { name: entry.submit, exact: true })
  await submit.click()
  await expectRequiredFieldError(field, entry.message)
  // Der Knopf blendet nach dem Laden wieder ein, axe misst sonst den halb durchsichtigen Zustand
  await expect(submit).toHaveCSS('opacity', '1')
  return field
}

for (const entry of SIGNED_IN_CASES) {
  for (const colorScheme of COLOR_SCHEMES) {
    test(`${entry.form}: leer abgeschickt steht der Fehler am Feld (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme })
      await submitEmpty(page, entry)
      await expectAccessibleLayout(page)
    })
  }
}

test.describe('abgemeldet', () => {
  test.use(signedOut)

  for (const colorScheme of COLOR_SCHEMES) {
    test(`Anmelden: leere Felder stehen je am Feld (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await submitEmpty(page, {
        form: 'Anmelden',
        path: '/anmelden',
        field: byLabel('Benutzername'),
        submit: 'Anmelden',
        message: 'Bitte deinen Benutzernamen eintragen.',
      })
      await expect(page.getByLabel('Passwort', { exact: true })).toHaveAccessibleDescription(
        'Bitte dein Passwort eintragen.',
      )
      await expect(page).toHaveURL(/\/anmelden$/)
      await expectAccessibleLayout(page)
    })
  }
})
