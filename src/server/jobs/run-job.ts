// Der Job-Runner ist die einzige Stelle mit try/catch für Jobs (UMSETZUNG M11-01). Ein geworfener
// Fehler wird protokolliert und weitergegeben, damit pg-boss den Job wiederholt. Eine ungültige
// Payload wird nur protokolliert: Ein neuer Versuch mit derselben Payload scheitert genauso.
import type { Logger } from '@/shared/lib/logger'
import type { Job } from './job-definition'

interface JobRun {
  job: Job
  payload: unknown
  /** Wievielter neuer Versuch (0 beim ersten Lauf), steht nur im Protokoll */
  retryCount: number
}

export async function runJob({ job, payload, retryCount }: JobRun, logger: Logger): Promise<void> {
  const startedAt = Date.now()
  const context = { job: job.name, retryCount }
  try {
    const result = await job.execute(payload, { logger })
    if (!result.ok) {
      logger.error('Job-Payload ungültig, der Job wird nicht wiederholt', {
        ...context,
        issues: result.error.issues,
      })
      return
    }
  } catch (error: unknown) {
    logger.error('Job fehlgeschlagen, pg-boss versucht es erneut', { ...context, error })
    throw error
  }
  logger.info('Job erledigt', { ...context, durationMs: Date.now() - startedAt })
}
