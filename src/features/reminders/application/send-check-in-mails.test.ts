import { describe, expect, it } from 'vitest'
import { createFakeMailSender } from '../../../../tests/helpers/fake-mail-sender'
import {
  createFakeReminderRepository,
  DEFAULT_TIMING,
} from '../../../../tests/helpers/fake-reminder-repository'
import {
  createFakeStockReader,
  product,
  spaghettiType,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { createMemoryLogger } from '../../../../tests/helpers/memory-logger'
import type { MailSender } from '@/server/notify/mail-sender'
import { sendCheckInMails } from './send-check-in-mails'

const householdId = 'haushalt-a'
const now = new Date('2026-11-29T09:00:00Z') // Sonntag, 10 Uhr in Berlin

const rice = product({ id: 'reis', foodType: { ...spaghettiType, id: 'art-reis', name: 'Reis' } })

function setUp(mail: MailSender = createFakeMailSender()) {
  const reader = createFakeStockReader({
    householdId,
    products: [product({ id: 'nudeln' }), rice],
    units: [unit('nudeln', '2026-11-20'), unit('reis', '2026-12-10'), unit('reis', '2027-06-01')],
  })
  const repository = createFakeReminderRepository(
    [{ householdId, ...DEFAULT_TIMING }],
    [
      { householdId, address: 'alex@example.org', cadence: 'woechentlich' },
      { householdId, address: 'kim@example.org', cadence: 'monatlich' },
    ],
  )
  const memory = createMemoryLogger()
  const deps = { reader, repository, mail, appUrl: null, logger: memory.logger }
  return { deps, memory }
}

describe('sendCheckInMails', () => {
  it('schickt die Check-in-Mail nur an Abos im passenden Rhythmus, mit Abgelaufenem und Fälligem', async () => {
    const mail = createFakeMailSender()
    const { deps } = setUp(mail)

    await sendCheckInMails(deps, { cadence: 'woechentlich', now })

    expect(mail.sent.map((message) => message.to)).toEqual(['alex@example.org'])
    expect(mail.sent[0]?.text).toContain('Abgelaufen: Spaghetti.')
    expect(mail.sent[0]?.text).toContain('Bald fällig: Reis.')
    expect(mail.sent[0]?.text).not.toContain('http')
  })

  it('tut ohne eingerichteten Mailversand nichts', async () => {
    const notConfigured: MailSender = {
      isConfigured: false,
      send: () => Promise.reject(new Error('darf nicht senden')),
    }
    const { deps, memory } = setUp(notConfigured)

    await sendCheckInMails(deps, { cadence: 'woechentlich', now })

    expect(memory.messages()).toEqual([
      'Check-in-Mail übersprungen, Mailversand ist nicht eingerichtet',
    ])
  })
})
