// Beispielvorrat für die E2E-Tests (POST /api/e2e/beispielvorrat, nur mit E2E_DEMO_STOCK). Jeder
// E2E-Lauf startet leer und wird über die Oberfläche eingerichtet. Danach legt diese Funktion im
// laufenden Server Personen, Lagerorte und Vorrat in den neuen Haushalt. Ein zweiter Prozess darf
// die PGlite-Datei nicht öffnen, solange der Server läuft, deshalb geht es nicht per Skript.
import { getDb } from '../../src/server/db/get-db'
import { seedDemoIntoHousehold } from './demo'

export async function seedDemoForE2e(householdId: string, userId: string): Promise<boolean> {
  return seedDemoIntoHousehold(await getDb(), { householdId, userId, today: new Date() })
}
