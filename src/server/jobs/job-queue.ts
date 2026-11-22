// Warteschlange und Zeitpläne mit pg-boss (UMSETZUNG M11-01). pg-boss legt seine Tabellen selbst
// im Schema `pgboss` an, außerhalb der Drizzle-Migrationen. Nur diese Datei kennt pg-boss.
import 'server-only'
import { PgBoss, type ConstructorOptions } from 'pg-boss'
import type { Logger } from '@/shared/lib/logger'
import { err, ok, type Result } from '@/shared/lib/result'
import type { Job } from './job-definition'
import { runJob } from './run-job'

/** Zeitpläne gelten in Berlin, egal in welcher Zeitzone der Container läuft. */
const JOB_TIME_ZONE = 'Europe/Berlin'

// Ein Lauf darf 15 Minuten dauern, danach gilt er als hängengeblieben und wird wiederholt.
const EXPIRE_SECONDS = 15 * 60
// Compose wartet beim Stoppen 30 Sekunden (stop_grace_period), danach kommt SIGKILL.
const STOP_TIMEOUT_MS = 20_000
// Eine kleine eigene Verbindungsgruppe reicht: Jobs laufen nacheinander.
const POOL_SIZE = 3
// Kurze Aussetzer der Datenbank beim Start überbrücken (1, 2, 4 … Sekunden Pause)
const START_ATTEMPTS = 5
const POSTGRES_URL = /^postgres(ql)?:\/\//

export type JobDatabase = Pick<ConstructorOptions, 'connectionString' | 'db' | 'backend' | 'max'>

/** pg-boss braucht PostgreSQL. PGlite gehört dem Webserver und lässt sich nicht teilen. */
export function jobDatabaseFor(databaseUrl: string): Result<JobDatabase, 'needs-postgres'> {
  if (!POSTGRES_URL.test(databaseUrl)) return err('needs-postgres')
  return ok({ connectionString: databaseUrl, max: POOL_SIZE })
}

export interface JobQueue {
  /** Stellt einen Job sofort ein, z. B. für einen Lauf von Hand oder im Test. */
  send: (name: string, payload: object) => Promise<string | null>
  /** Wartet auf laufende Jobs (höchstens 20 Sekunden) und schließt die Verbindungen. */
  stop: () => Promise<void>
}

function queueOptionsFor({ retry }: Job) {
  return {
    retryLimit: retry.limit,
    retryDelay: retry.delaySeconds,
    retryBackoff: retry.delaySeconds > 0,
    expireInSeconds: EXPIRE_SECONDS,
  }
}

async function registerJob(boss: PgBoss, job: Job, logger: Logger): Promise<void> {
  await boss.createQueue(job.name, queueOptionsFor(job))
  await boss.work(job.name, async (jobs) => {
    for (const { data, retryCount } of jobs)
      await runJob({ job, payload: data, retryCount }, logger)
  })
  if (job.schedule === null) {
    await boss.unschedule(job.name)
    return
  }
  await boss.schedule(job.name, job.schedule.cron, job.schedule.payload, { tz: JOB_TIME_ZONE })
}

interface StartJobQueue {
  database: JobDatabase
  jobs: readonly Job[]
  logger: Logger
}

export async function startJobQueue({ database, jobs, logger }: StartJobQueue): Promise<JobQueue> {
  const boss = new PgBoss(database)
  boss.on('error', (error) => {
    logger.error('Fehler in der Warteschlange', { error })
  })
  boss.on('warning', (warning) => {
    logger.warn('Hinweis der Warteschlange', { warning })
  })
  await boss.start({ attempts: START_ATTEMPTS })
  for (const job of jobs) await registerJob(boss, job, logger)
  return {
    send: (name, payload) => boss.send(name, payload),
    stop: () => boss.stop({ graceful: true, timeout: STOP_TIMEOUT_MS }),
  }
}
