import { expect, type Locator } from '@playwright/test'

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Formular, in dem das Feld steht, z. B. um seinen Absende-Knopf zu finden */
export const formOf = (field: Locator): Locator => field.locator('xpath=ancestor::form[1]')

// Pflichtfeld leer abgeschickt (#286): Die Meldung kommt aus dem Schema der Action, steht auf Deutsch
// am Feld (am Ende der Beschreibung, nach einem Hinweis) und der Fokus springt hin. Die Sprechblase
// des Browsers bleibt aus, weil das Formular selbst prüft (noValidate). `required` bleibt als
// Hinweis für Screenreader.
export async function expectRequiredFieldError(
  field: Locator,
  message: string | RegExp,
): Promise<void> {
  const ending = typeof message === 'string' ? new RegExp(`${escapeRegExp(message)}$`) : message
  await expect(field).toHaveAccessibleDescription(ending)
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(field).toBeFocused()
  await expect(field).toHaveAttribute('required', '')
  await expect(formOf(field)).toHaveJSProperty('noValidate', true)
}
