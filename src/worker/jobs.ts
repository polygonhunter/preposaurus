// Alle Jobs des Workers mit ihren Zeitplänen (Europe/Berlin). Jeder Job ruft einen Use-Case auf,
// eigene Logik steht hier nicht.
import { z } from 'zod'
import { cleanUpCaptures } from '@/features/capture/application/clean-up-captures'
import { reminderStores } from '@/features/reminders/application/reminder-services'
import type { ReminderPush } from '@/features/reminders/application/reminder-push'
import type { CheckInCadence } from '@/features/reminders/application/reminder-repository'
import { sendCheckInMails } from '@/features/reminders/application/send-check-in-mails'
import { sendDueReminders } from '@/features/reminders/application/send-due-reminders'
import { getDb } from '@/server/db/get-db'
import { defineJob, type Job } from '@/server/jobs/job-definition'
import type { MailSender } from '@/server/notify/mail-sender'
import { createPhotoStorage } from '@/server/storage/create-photo-storage'
import { CHECK_IN_CADENCES } from '@/shared/config/constants'
import { loadEnv } from '@/shared/config/env'

export interface WorkerDeps {
  mail: MailSender
  push: ReminderPush
  appUrl: string | null
}

const noPayload = z.strictObject({})
const checkInPayload = z.strictObject({ cadence: z.enum(CHECK_IN_CADENCES) })

// Nach der Sicherung um 3:00 Uhr (BACKUP_TIME), damit sie den Stand vor dem Aufräumen enthält.
const NIGHTLY_CLEANUP = '30 4 * * *'
// Die Wochenübersicht geht so höchstens 10 Minuten nach der gewählten Uhrzeit hinaus.
const EVERY_TEN_MINUTES = '*/10 * * * *'
// Check-in-Mail: sonntags bzw. am Monatsersten um 10 Uhr, nicht am Tag der Wochenübersicht (Sa).
const CHECK_IN_CRON = {
  woechentlich: '0 10 * * 0',
  monatlich: '0 10 1 * *',
} as const satisfies Record<CheckInCadence, string>
// Ein gescheiterter Lauf wird nicht wiederholt, der nächste kommt ohnehin in 10 Minuten.
const NO_RETRY = { limit: 0, delaySeconds: 0 }

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

function dueReminders(deps: WorkerDeps): Job {
  return defineJob({
    name: 'due-reminders',
    schema: noPayload,
    schedule: { cron: EVERY_TEN_MINUTES, payload: {} },
    retry: NO_RETRY,
    run: async (_payload, { logger }) => {
      await sendDueReminders({ ...(await reminderStores()), ...deps, logger }, new Date())
    },
  })
}

function checkInMails(deps: WorkerDeps, cadence: CheckInCadence): Job {
  return defineJob({
    name: `check-in-mail-${cadence}`,
    schema: checkInPayload,
    schedule: { cron: CHECK_IN_CRON[cadence], payload: { cadence } },
    run: async (payload, { logger }) => {
      const run = { cadence: payload.cadence, now: new Date() }
      await sendCheckInMails({ ...(await reminderStores()), ...deps, logger }, run)
    },
  })
}

export function createJobs(deps: WorkerDeps): Job[] {
  const checkIns = CHECK_IN_CADENCES.map((cadence) => checkInMails(deps, cadence))
  return [captureCleanup, dueReminders(deps), ...checkIns]
}
