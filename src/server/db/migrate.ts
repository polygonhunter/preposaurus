// Aufruf: npm run db:migrate. Spielt alle Migrationen aus db/migrations ein, auch im Container.
import 'server-only'
import { loadEnv } from '../../shared/config/env'
import { createLogger } from '../../shared/lib/logger'
import { connectDatabase } from './client'

const env = loadEnv()
const connection = await connectDatabase(env.DATABASE_URL)
try {
  await connection.migrate()
  createLogger({ level: env.LOG_LEVEL }).info('Migrationen eingespielt')
} finally {
  await connection.close()
}
