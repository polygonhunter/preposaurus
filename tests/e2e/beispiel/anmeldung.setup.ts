// Läuft vor den Tests mit Beispielvorrat (playwright.beispiel.config.ts): meldet beide Konten aus
// tests/e2e/beispiel/seed-db.ts über die Oberfläche an und speichert ihre Sitzungen.
import { test as setup } from '@playwright/test'
import { signInViaUi } from '../../helpers/e2e-auth'
import { E2E_DEMO_ADMIN, E2E_EMPTY_ADMIN } from '../../helpers/e2e-demo-users'

for (const account of [E2E_DEMO_ADMIN, E2E_EMPTY_ADMIN]) {
  setup(`Anmelden als ${account.username}`, async ({ page }) => {
    await signInViaUi(page, account)
    await page.context().storageState({ path: account.storageState })
  })
}
