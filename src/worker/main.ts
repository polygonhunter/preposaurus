// Einstieg des Worker-Containers (UMSETZUNG M11-01): `preposaurus worker` im Image, lokal
// `npm run worker`. Derselbe Code wie der Webserver, nur ein anderer Einstieg.
import { jobDatabaseFor, startJobQueue } from '@/server/jobs/job-queue'
import { loadEnv } from '@/shared/config/env'
import { createLogger, type Logger } from '@/shared/lib/logger'
import { createJobs } from './jobs'
import { stopOnSignal } from './shutdown'

const env = loadEnv()
const logger = createLogger({ level: env.LOG_LEVEL })

function fail(message: string, context?: Record<string, unknown>): void {
  logger.error(message, context)
  process.exitCode = 1
}

async function startWorker(databaseUrl: string, log: Logger): Promise<void> {
  const database = jobDatabaseFor(databaseUrl)
  if (!database.ok) {
    fail('Der Worker braucht PostgreSQL (DATABASE_URL mit postgres://).')
    return
  }
  const jobs = createJobs()
  const queue = await startJobQueue({ database: database.value, jobs, logger: log })
  log.info('Worker gestartet', { jobs: jobs.map((job) => job.name) })
  stopOnSignal(process, {
    stop: queue.stop,
    logger: log,
    onFailure: () => {
      process.exitCode = 1
    },
  })
}

// Scheitert der Start (z. B. Datenbank nicht erreichbar), startet Compose den Dienst neu.
await startWorker(env.DATABASE_URL, logger).catch((error: unknown) => {
  fail('Worker konnte nicht starten', { error })
})
