import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from './tests/helpers/e2e-auth'

// E2E_PORT, wenn mehrere Arbeitskopien gleichzeitig testen (sonst nutzt reuseExistingServer den
// Server einer anderen Kopie mit anderer Datenbank).
const PORT = Number(process.env['E2E_PORT'] ?? 3100)
const isCi = Boolean(process.env['CI'])

// Geräte aus design.html „Geräte und Umbruchpunkte“.
const touch = { isMobile: true, hasTouch: true }

// Alle Projekte starten mit der Sitzung, die das Projekt „einrichtung“ anlegt (tests/helpers/e2e-auth.ts).
const signedIn = { storageState: ADMIN_STORAGE_STATE }
const afterSetup = ['einrichtung']

// Jeder Lauf beginnt mit einer leeren, migrierten Datenbank, damit die Ersteinrichtung testbar ist.
// Dazu nur die Stammdaten (Lebensmittelarten, Behälter) wie im Container, ohne Haushalt.
const E2E_DATA_DIR = '.data/e2e'
const freshDatabase = `rm -rf ${E2E_DATA_DIR} && npm run db:migrate && npm run db:seed`
const startServer = isCi ? 'npm run start:standalone' : `npm run dev -- -p ${String(PORT)}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'einrichtung', testMatch: /einrichtung\.setup\.ts$/ },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 15'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        ...signedIn,
      },
      dependencies: afterSetup,
    },
    {
      name: 'duo-aussen',
      use: {
        browserName: 'chromium',
        viewport: { width: 382, height: 580 },
        ...touch,
        ...signedIn,
      },
      dependencies: afterSetup,
    },
    {
      name: 'duo-hoch',
      use: {
        browserName: 'chromium',
        viewport: { width: 669, height: 867 },
        ...touch,
        ...signedIn,
      },
      dependencies: afterSetup,
    },
    {
      name: 'duo-quer',
      use: {
        browserName: 'chromium',
        viewport: { width: 951, height: 585 },
        ...touch,
        ...signedIn,
      },
      dependencies: afterSetup,
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, ...signedIn },
      dependencies: afterSetup,
    },
  ],
  webServer: {
    // Lokal gegen den Dev-Server, in der CI gegen den Standalone-Server wie im Container (UMSETZUNG §5).
    command: `${freshDatabase} && ${startServer}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    env: {
      // Absolut, weil der Standalone-Server der CI in .next/standalone startet (chdir)
      DATABASE_URL: `pglite://${resolve(E2E_DATA_DIR)}`,
      AI_PROVIDER: 'fake',
      // Nur für die E2E-Tests, kein Geheimnis (env.ts verlangt mindestens 32 Zeichen)
      APP_SECRET: 'e2e-nur-zum-testen-kein-geheimnis-000',
      LOG_LEVEL: 'warn',
      // Musterseite auch im Standalone-Build der CI (muster.spec.ts)
      SHOW_PATTERN_PAGE: 'true',
      // Standalone-Server über http://localhost: WebKit verwirft dort Secure-Cookies
      E2E_INSECURE_COOKIES: 'true',
      PORT: String(PORT),
      // server.js bindet an HOSTNAME, und GitHub Actions setzt dort den Rechnernamen.
      ...(isCi ? { HOSTNAME: '0.0.0.0' } : {}),
    },
  },
})
