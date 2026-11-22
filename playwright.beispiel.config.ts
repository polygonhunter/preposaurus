import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { E2E_DEMO_ADMIN } from './tests/helpers/e2e-demo-users'

// E2E mit Beispielvorrat (#67 bis #70): eigene Datenbank mit Beispielhaushalt, erfundener Quelle und
// einem leeren Haushalt, vorab eingespielt (tests/e2e/beispiel/seed-db.ts). Die Haupt-Konfiguration
// braucht eine leere Datenbank für die Ersteinrichtung, deshalb läuft das hier getrennt und danach
// (npm run e2e). Eigener Port, weil beide Server nie gleichzeitig laufen sollen.
const PORT = Number(process.env['E2E_PORT'] ?? 3100) + 1
const isCi = Boolean(process.env['CI'])

const E2E_DATA_DIR = '.data/e2e-beispiel'
const freshDatabase = `rm -rf ${E2E_DATA_DIR} && npx tsx --conditions=react-server tests/e2e/beispiel/seed-db.ts`
const startServer = isCi ? 'npm run start:standalone' : `npm run dev -- -p ${String(PORT)}`

const signedIn = { storageState: E2E_DEMO_ADMIN.storageState }
const afterSignIn = ['anmeldung']

export default defineConfig({
  testDir: 'tests/e2e/beispiel',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-beispiel' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'anmeldung', testMatch: /anmeldung\.setup\.ts$/ },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 15'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        ...signedIn,
      },
      dependencies: afterSignIn,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, ...signedIn },
      dependencies: afterSignIn,
    },
  ],
  webServer: {
    command: `${freshDatabase} && ${startServer}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    env: {
      DATABASE_URL: `pglite://${resolve(E2E_DATA_DIR)}`,
      AI_PROVIDER: 'fake',
      // Nur für die E2E-Tests, kein Geheimnis (env.ts verlangt mindestens 32 Zeichen)
      APP_SECRET: 'e2e-nur-zum-testen-kein-geheimnis-000',
      LOG_LEVEL: 'warn',
      E2E_INSECURE_COOKIES: 'true',
      PORT: String(PORT),
      ...(isCi ? { HOSTNAME: '0.0.0.0' } : {}),
    },
  },
})
