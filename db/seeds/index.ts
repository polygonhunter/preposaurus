// Aufruf: npm run db:seed. Spielt die Stammdaten ein, auch im Container nach den Migrationen.
import { connectDatabase } from '../../src/server/db/client'
import { loadEnv } from '../../src/shared/config/env'
import { createLogger } from '../../src/shared/lib/logger'
import { seedMasterData } from './master-data'

const env = loadEnv()
const connection = await connectDatabase(env.DATABASE_URL)
try {
  await seedMasterData(connection.db)
  createLogger({ level: env.LOG_LEVEL }).info('Stammdaten eingespielt')
} finally {
  await connection.close()
}
