// Aufruf: npm run db:seed:demo. Spielt Stammdaten und den Beispielhaushalt ein (nur Entwicklung).
import { connectDatabase } from '../../src/server/db/client'
import { loadEnv } from '../../src/shared/config/env'
import { createLogger } from '../../src/shared/lib/logger'
import { seedDemo } from './demo'
import { seedMasterData } from './master-data'

const env = loadEnv()
const logger = createLogger({ level: env.LOG_LEVEL })
const connection = await connectDatabase(env.DATABASE_URL)
try {
  await seedMasterData(connection.db)
  const created = await seedDemo(connection.db, new Date())
  logger.info(
    created ? 'Beispielhaushalt angelegt' : 'Es gibt schon einen Haushalt, Demo übersprungen',
  )
} finally {
  await connection.close()
}
