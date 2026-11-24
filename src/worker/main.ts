// Einstieg des Worker-Containers (UMSETZUNG M11-01): `preposaurus worker` im Image, lokal
// `npm run worker`. Derselbe Code wie der Webserver, nur ein anderer Einstieg.
import { noPush } from '@/features/reminders/application/reminder-push'
import { closeDb, openDb } from '@/server/db/get-db'
import { jobDatabaseFor, startJobQueue, type JobDatabase } from '@/server/jobs/job-queue'
import { createMailSender } from '@/server/notify/create-mail-sender'
import { loadEnv, type Env } from '@/shared/config/env'
import { createLogger } from '@/shared/lib/logger'
import { createJobs } from './jobs'
import { stopOnSignal } from './shutdown'

const env = loadEnv()
const logger = createLogger({ level: env.LOG_LEVEL })

function fail(message: string, context?: Record<string, unknown>): void {
  logger.error(message, context)
  process.exitCode = 1
}

async function startWorker(database: JobDatabase, settings: Env): Promise<void> {
  // Vor allen Jobs: So heißt auch die Verbindung der Jobs „preposaurus-worker“ (#261)
  await openDb('worker')
  const mail = createMailSender(settings)
  // Push kommt mit M11-03 (#86). Bis dahin geht die Wochenübersicht nur als Mail.
  const jobs = createJobs({ mail, push: noPush, appUrl: settings.APP_URL ?? null })
  const queue = await startJobQueue({ database, jobs, logger })
  logger.info('Worker gestartet', { jobs: jobs.map((job) => job.name), mail: mail.isConfigured })
  stopOnSignal(process, {
    stop: async () => {
      await queue.stop()
      await closeDb()
    },
    logger,
    onFailure: () => {
      process.exitCode = 1
    },
  })
}

const database = jobDatabaseFor(env.DATABASE_URL)
if (database.ok) {
  // Scheitert der Start (z. B. Datenbank nicht erreichbar), startet Compose den Dienst neu.
  await startWorker(database.value, env).catch((error: unknown) => {
    fail('Worker konnte nicht starten', { error })
  })
} else {
  fail('Der Worker braucht PostgreSQL (DATABASE_URL mit postgres://).')
}
