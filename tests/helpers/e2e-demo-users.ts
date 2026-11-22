// Erfundene Anmeldedaten für die E2E-Tests mit Beispielvorrat (playwright.beispiel.config.ts).
// tests/e2e/beispiel/seed-db.ts legt die Konten an, das Projekt „anmeldung“ meldet beide an.
// Nur für die Wegwerf-Datenbank der E2E-Tests, kein Geheimnis.

/** Admin des Beispielhaushalts aus db/seeds/demo-data.ts */
export const E2E_DEMO_ADMIN = {
  username: 'alex',
  password: 'Hafer Linse Regal Beispiel',
  storageState: '.data/e2e-auth/beispiel-alex.json',
} as const

/** Admin eines Haushalts wie nach der Ersteinrichtung: ohne Mitglieder, ohne Vorrat */
export const E2E_EMPTY_ADMIN = {
  username: 'neu',
  password: 'Wolke Regal Linse Beispiel',
  storageState: '.data/e2e-auth/beispiel-neu.json',
} as const
