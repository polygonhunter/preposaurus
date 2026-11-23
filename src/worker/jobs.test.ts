import { describe, expect, it } from 'vitest'
import { createFakeMailSender } from '../../tests/helpers/fake-mail-sender'
import { noPush } from '@/features/reminders/application/reminder-push'
import { createJobs } from './jobs'

const jobs = createJobs({ mail: createFakeMailSender(), push: noPush, appUrl: null })

describe('createJobs', () => {
  it('plant Aufräumen, Erinnerungen und beide Check-in-Mails', () => {
    expect(jobs.map((job) => [job.name, job.schedule?.cron])).toEqual([
      ['capture-cleanup', '30 4 * * *'],
      ['due-reminders', '*/10 * * * *'],
      ['check-in-mail-woechentlich', '0 10 * * 0'],
      ['check-in-mail-monatlich', '0 10 1 * *'],
    ])
  })

  it('wiederholt die Erinnerungen nicht, weil der nächste Lauf ohnehin bald kommt', () => {
    expect(jobs.find((job) => job.name === 'due-reminders')?.retry.limit).toBe(0)
  })

  it('weist eine Check-in-Payload mit unbekanntem Rhythmus zurück', async () => {
    const weekly = jobs.find((job) => job.name === 'check-in-mail-woechentlich')
    const result = await weekly?.execute({ cadence: 'taeglich' }, { logger: noLogger })
    expect(result?.ok).toBe(false)
  })
})

const ignore = () => undefined
const noLogger = { debug: ignore, info: ignore, warn: ignore, error: ignore }
