import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const isCi = Boolean(process.env['CI'])

// Geräte aus design.html „Geräte und Umbruchpunkte“.
const touch = { isMobile: true, hasTouch: true }

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
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 15'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'duo-aussen',
      use: { browserName: 'chromium', viewport: { width: 382, height: 580 }, ...touch },
    },
    {
      name: 'duo-hoch',
      use: { browserName: 'chromium', viewport: { width: 669, height: 867 }, ...touch },
    },
    {
      name: 'duo-quer',
      use: { browserName: 'chromium', viewport: { width: 951, height: 585 }, ...touch },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Lokal gegen den Dev-Server, in der CI gegen den Standalone-Server wie im Container (UMSETZUNG §5).
    // Vorher frische E2E-Datenbank mit Stammdaten und Beispielhaushalt (npm run e2e:db), solange
    // noch kein Server die PGlite-Datei offen hat.
    command: `npm run e2e:db && ${isCi ? 'npm run start:standalone' : `npm run dev -- -p ${String(PORT)}`}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    env: {
      DATABASE_URL: 'pglite://./.data/e2e',
      AI_PROVIDER: 'fake',
      // Nur für die E2E-Tests, kein Geheimnis (env.ts verlangt mindestens 32 Zeichen)
      APP_SECRET: 'e2e-nur-zum-testen-kein-geheimnis-000',
      LOG_LEVEL: 'warn',
      // Musterseite auch im Standalone-Build der CI (muster.spec.ts)
      SHOW_PATTERN_PAGE: 'true',
      // Vorrat ohne Anmeldung auch im Standalone-Build der CI, bis #33 die Anmeldung bringt
      DEV_HOUSEHOLD_WITHOUT_LOGIN: 'true',
      PORT: String(PORT),
      // server.js bindet an HOSTNAME, und GitHub Actions setzt dort den Rechnernamen.
      ...(isCi ? { HOSTNAME: '0.0.0.0' } : {}),
    },
  },
})
