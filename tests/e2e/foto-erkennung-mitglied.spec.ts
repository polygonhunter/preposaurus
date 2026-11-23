import { expect, test } from '@playwright/test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Ein Mitglied sieht die Foto-Erkennung nicht (#108), auch nicht per Direktaufruf. Eigene Sitzung,
// damit die des Admins bleibt.
test.use(signedOut)

test('Mitglied sieht die Foto-Erkennung nicht', async ({ page }) => {
  await signInViaUi(page, E2E_MEMBER)
  await page.goto('/einstellungen')
  await expect(page.getByRole('link', { name: /Foto-Erkennung/ })).toHaveCount(0)

  const response = await page.goto('/einstellungen/foto-erkennung')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Nicht gefunden' })).toBeVisible()
  await expect(page.getByLabel('API-Schlüssel von Anthropic')).toHaveCount(0)
  await expectAccessibleLayout(page)
})
