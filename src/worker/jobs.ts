// Alle Jobs des Workers mit ihren Zeitplänen (Europe/Berlin). Jeder Job ruft einen Use-Case auf,
// eigene Logik steht hier nicht.
import { z } from 'zod'
import { defineJob, type Job } from '@/server/jobs/job-definition'

const noPayload = z.strictObject({})

// Nach der Sicherung um 3:00 Uhr (BACKUP_TIME), damit sie den Stand vor dem Aufräumen enthält.
const NIGHTLY_CLEANUP = '30 4 * * *'

/** Tägliches Aufräumen alter Entwürfe und verwaister Fotos (M6-12). */
const captureCleanup = defineJob({
  name: 'capture-cleanup',
  schema: noPayload,
  schedule: { cron: NIGHTLY_CLEANUP, payload: {} },
  // TODO(#66): Use-Case zum Aufräumen aufrufen, sobald es ihn gibt. Bis dahin nur der Zeitplan.
  run: (_payload, { logger }) => {
    logger.debug('Aufräumen ist noch nicht eingebaut (#66)')
    return Promise.resolve()
  },
})

export function createJobs(): Job[] {
  return [captureCleanup]
}
