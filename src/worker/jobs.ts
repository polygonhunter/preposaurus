// Alle Jobs des Workers mit ihren Zeitplänen (Europe/Berlin). Jeder Job ruft einen Use-Case auf,
// eigene Logik steht hier nicht.
import { z } from 'zod'
import { cleanUpCaptures } from '@/features/capture/application/clean-up-captures'
import { getDb } from '@/server/db/get-db'
import { defineJob, type Job } from '@/server/jobs/job-definition'
import { createPhotoStorage } from '@/server/storage/create-photo-storage'
import { loadEnv } from '@/shared/config/env'

const noPayload = z.strictObject({})

// Nach der Sicherung um 3:00 Uhr (BACKUP_TIME), damit sie den Stand vor dem Aufräumen enthält.
const NIGHTLY_CLEANUP = '30 4 * * *'

/**
 * Tägliches Aufräumen alter Entwürfe und verwaister Fotos (M6-12, #66). Ohne Bildverarbeitung
 * (sharp): Aufräumen braucht nur DB und Foto-Speicher.
 */
const captureCleanup = defineJob({
  name: 'capture-cleanup',
  schema: noPayload,
  schedule: { cron: NIGHTLY_CLEANUP, payload: {} },
  run: async (_payload, { logger }) => {
    const deps = { db: await getDb(), storage: createPhotoStorage(loadEnv()) }
    const result = await cleanUpCaptures(deps, new Date())
    logger.info('Erfassung aufgeräumt', { ...result })
  },
})

export function createJobs(): Job[] {
  return [captureCleanup]
}
