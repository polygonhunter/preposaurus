import { expect, test } from '../helpers/e2e-test'

// Haushaltsschalter der Foto-Erkennung (#108, #79). Er gilt für den ganzen Haushalt, und die
// Foto-Erfassung verlässt sich darauf, dass die Erkennung aus ist („Neu“ führt ins Formular, Satz in
// der Kamera). Deshalb läuft dieser Test im Projekt „foto“ mit einem Worker, nie gleichzeitig mit
// erfassen-foto.spec.ts (Review #297), und schaltet am Ende wieder aus.

test('Haushaltsschalter an- und wieder ausschalten', async ({ page }) => {
  await page.goto('/einstellungen/foto-erkennung')
  const toggle = page.getByRole('switch', { name: 'Foto-Erkennung' })
  await expect(toggle).not.toBeChecked()
  const saveToggle = page.getByRole('button', { name: 'Speichern' }).first()

  await page.locator('label', { hasText: 'Foto-Erkennung' }).click()
  await expect(toggle).toBeChecked()
  await saveToggle.click()
  await expect(page.getByText('Die Foto-Erkennung ist an.')).toBeVisible()
  await page.reload()
  await expect(toggle).toBeChecked()

  await page.locator('label', { hasText: 'Foto-Erkennung' }).click()
  await saveToggle.click()
  await expect(page.getByText('Die Foto-Erkennung ist aus.')).toBeVisible()
  await page.reload()
  await expect(toggle).not.toBeChecked()
})
