// Läuft nach „einrichtung“ (playwright.config.ts): legt den Beispielvorrat (db/seeds/demo-data.ts)
// in den eben über die Oberfläche angelegten Haushalt. Die Vorrat-Tests lesen und ändern ihn.
// Hat der Haushalt schon Produkte (lokal mit reuseExistingServer), bleibt alles, wie es ist.
import { expect, test as setup } from '../helpers/e2e-test'

setup('Beispielvorrat im eingerichteten Haushalt', async ({ request }) => {
  const response = await request.post('/api/e2e/beispielvorrat')

  expect(response.status()).toBe(200)
})
