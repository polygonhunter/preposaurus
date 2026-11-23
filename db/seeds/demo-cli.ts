// Aufruf: npm run db:seed:demo. Spielt Stammdaten, den Beispielhaushalt und die erfundene
// Beispielquelle ein (nur Entwicklung), damit die Übersicht Tage zeigt.
import { connectDatabase } from '../../src/server/db/client'
import { households } from '../../src/server/db/schema/household'
import { loadEnv } from '../../src/shared/config/env'
import { createLogger } from '../../src/shared/lib/logger'
import { seedDemo } from './demo'
import { seedDemoSource } from './demo-source'
import { seedMasterData } from './master-data'

const env = loadEnv()
const logger = createLogger({ level: env.LOG_LEVEL })
const connection = await connectDatabase(env.DATABASE_URL)
try {
  await seedMasterData(connection.db)
  const created = await seedDemo(connection.db, new Date())
  const [household] = created
    ? await connection.db.select({ id: households.id }).from(households)
    : []
  if (household !== undefined) await seedDemoSource(connection.db, household.id)
  logger.info(
    created ? 'Beispielhaushalt angelegt' : 'Es gibt schon einen Haushalt, Demo übersprungen',
  )
} finally {
  await connection.close()
}
