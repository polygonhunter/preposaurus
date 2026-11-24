import { describe, expect, it, vi } from 'vitest'
import { createFakeMailSender } from '../../../../tests/helpers/fake-mail-sender'
import {
  createFakeReminderRepository,
  DEFAULT_TIMING,
} from '../../../../tests/helpers/fake-reminder-repository'
import { createFakeStockReader, product, unit } from '../../../../tests/helpers/fake-stock-reader'
import { createMemoryLogger } from '../../../../tests/helpers/memory-logger'
import { toCalendarDay } from '@/shared/lib/dates'
import type { ReminderMessage } from '../domain/message'
import { noPush, type ReminderPush } from './reminder-push'
import type { ReminderGoalFacts } from './reminder-stock'
import { sendDueReminders } from './send-due-reminders'

const householdId = 'haushalt-a'
const tuesdayMorning = new Date('2026-11-24T08:00:00Z') // 9:00 Uhr in Berlin
const saturdayAfterTen = new Date('2026-11-28T09:05:00Z') // Sa 10:05 Uhr in Berlin
const dueSoon = unit('nudeln', '2026-11-29')
const addedAt = new Date('2026-11-20T10:00:00Z')

interface SetUpOptions {
  push?: ReminderPush
  addresses?: string[]
  urgentSentAt?: Date
  addedAt?: Date
  units?: ReturnType<typeof unit>[]
  goals?: ReminderGoalFacts
  settings?: typeof DEFAULT_TIMING.settings
}

const noGoal: ReminderGoalFacts = {
  loadGoalStatus: () => Promise.resolve(null),
  countOpenRestockItems: () => Promise.resolve(0),
}

function setUp(options: SetUpOptions = {}) {
  const reader = createFakeStockReader({
    householdId,
    products: [product({ id: 'nudeln' })],
    units: options.units ?? [dueSoon, unit('nudeln', null)],
  })
  const loadUnits = vi.spyOn(reader, 'loadUnits')
  const repository = createFakeReminderRepository([
    {
      householdId,
      ...DEFAULT_TIMING,
      settings: options.settings ?? DEFAULT_TIMING.settings,
      lastSent: { 'weekly-summary': null, urgent: options.urgentSentAt ?? null },
      addresses: options.addresses ?? ['alex@example.org', 'id-1@nutzer.invalid'],
      addedTimes: { [dueSoon.id]: options.addedAt ?? addedAt },
      missingDateCount: 1,
    },
  ])
  const mail = createFakeMailSender()
  const memory = createMemoryLogger()
  const deps = {
    reader,
    repository,
    goals: options.goals ?? noGoal,
    push: options.push ?? noPush,
    mail,
    appUrl: 'https://haushalt.beispiel.ts.net',
    logger: memory.logger,
  }
  return { deps, repository, mail, loadUnits, memory }
}

function pushTo(devices: number) {
  const sent: ReminderMessage[] = []
  const push: ReminderPush = {
    deliver: (_householdId, message) => {
      sent.push(message)
      return Promise.resolve(devices)
    },
  }
  return { push, sent }
}

describe('sendDueReminders', () => {
  it('schickt „Dringend“ per Push und setzt danach den Merker', async () => {
    const { push, sent } = pushTo(2)
    const { deps, repository, mail } = setUp({ push })

    await sendDueReminders(deps, tuesdayMorning)

    expect(sent.map((message) => message.kind)).toEqual(['urgent'])
    expect(sent[0]?.lines.join(' ')).toContain('Spaghetti')
    expect(repository.marks).toEqual([{ householdId, kinds: ['urgent'], at: tuesdayMorning }])
    expect(mail.sent).toEqual([])
  })

  it('meldet am nächsten Tag nur, was seit dem letzten Versand erfasst wurde', async () => {
    const urgentSentAt = new Date('2026-11-23T08:00:00Z')
    const later = pushTo(1)
    await sendDueReminders(
      setUp({ push: later.push, urgentSentAt, addedAt: new Date('2026-11-23T12:00:00Z') }).deps,
      tuesdayMorning,
    )
    const earlier = pushTo(1)
    await sendDueReminders(setUp({ push: earlier.push, urgentSentAt }).deps, tuesdayMorning)

    expect(later.sent).toHaveLength(1)
    expect(earlier.sent).toEqual([])
  })

  it('schickt „Dringend“ nie als Mail und setzt ohne Empfänger keinen Merker', async () => {
    const { deps, repository, mail } = setUp()

    await sendDueReminders(deps, tuesdayMorning)

    expect(mail.sent).toEqual([])
    expect(repository.marks).toEqual([])
  })

  it('schickt die Wochenübersicht ohne Push als Mail an echte Adressen, mit Link', async () => {
    const { deps, repository, mail } = setUp()

    await sendDueReminders(deps, saturdayAfterTen)

    expect(mail.sent.map((message) => message.to)).toEqual(['alex@example.org'])
    expect(mail.sent[0]?.subject).toBe('Eure Wochenübersicht')
    expect(mail.sent[0]?.text).toContain('Bei 1 Packung fehlt noch das Datum.')
    expect(mail.sent[0]?.text).toContain('https://haushalt.beispiel.ts.net')
    expect(repository.marks).toEqual([
      { householdId, kinds: ['weekly-summary', 'urgent'], at: saturdayAfterTen },
    ])
  })

  it('schickt keine Mail, wenn die Wochenübersicht per Push angekommen ist', async () => {
    const { push, sent } = pushTo(1)
    const { deps, mail } = setUp({ push })

    await sendDueReminders(deps, saturdayAfterTen)

    expect(sent.map((message) => message.kind)).toEqual(['weekly-summary'])
    expect(mail.sent).toEqual([])
  })

  it('lädt den Vorrat gar nicht, solange nichts an der Reihe ist', async () => {
    const { push, sent } = pushTo(1)
    const { deps, loadUnits } = setUp({ push })

    await sendDueReminders(deps, new Date('2026-11-24T21:30:00Z')) // Ruhezeit, 22:30 Uhr

    expect(loadUnits).not.toHaveBeenCalled()
    expect(sent).toEqual([])
  })

  it('setzt keinen Merker, wenn die Mail an niemanden ging', async () => {
    const { deps, repository, mail, memory } = setUp({ addresses: ['id-1@nutzer.invalid'] })

    await sendDueReminders(deps, saturdayAfterTen)

    expect(mail.sent).toEqual([])
    expect(repository.marks).toEqual([])
    expect(memory.messages()).toEqual(['Erinnerung hatte keinen Empfänger'])
  })

  it('schickt die Wochenübersicht auch ohne fällige Packungen, wenn das Ziel offen ist (#186)', async () => {
    const { push, sent } = pushTo(1)
    const asked: string[] = []
    const goals: ReminderGoalFacts = {
      loadGoalStatus: ({ householdId: id }) => {
        asked.push(id)
        return Promise.resolve({
          suppliedDays: 6.4,
          targetDays: 10,
          targetDate: toCalendarDay('2027-03-01'),
        })
      },
      countOpenRestockItems: (id) => {
        asked.push(id)
        return Promise.resolve(3)
      },
    }
    const { deps } = setUp({ push, units: [], goals })

    await sendDueReminders(deps, saturdayAfterTen)

    expect(sent.map((message) => message.kind)).toEqual(['weekly-summary'])
    expect(sent[0]?.lines).toEqual([
      'Nachkaufen: 3 Einträge offen.',
      'Ziel 01.03.2027: 6 von 10 Tagen.',
      'Bei 1 Packung fehlt noch das Datum.',
    ])
    expect(asked).toEqual([householdId, householdId])
  })
})

// Der Worker hält sich an die Einstellungen des Haushalts (#89)
describe('sendDueReminders mit eigenen Einstellungen', () => {
  const tuesdayEvening = {
    weeklySummary: { isEnabled: true, weekday: 2, time: '18:30:00' },
    isUrgentEnabled: true,
  }

  it('schickt die Wochenübersicht am gewählten Tag ab der gewählten Uhrzeit', async () => {
    const { push, sent } = pushTo(1)
    const { deps } = setUp({ push, settings: tuesdayEvening })

    await sendDueReminders(deps, new Date('2026-11-24T17:25:00Z')) // Di 18:25 Uhr
    expect(sent).toEqual([])
    await sendDueReminders(deps, new Date('2026-11-24T17:35:00Z')) // Di 18:35 Uhr
    expect(sent.map((message) => message.kind)).toEqual(['weekly-summary'])
  })

  it('schickt am Samstag keine Wochenübersicht mehr, wenn ein anderer Tag gewählt ist', async () => {
    const { push, sent } = pushTo(1)
    const urgentOff = { ...tuesdayEvening, isUrgentEnabled: false }
    const { deps, loadUnits } = setUp({ push, settings: urgentOff })

    await sendDueReminders(deps, saturdayAfterTen)

    expect(sent).toEqual([])
    expect(loadUnits).not.toHaveBeenCalled()
  })

  it('schickt nichts, wenn Wochenübersicht und „Dringend“ aus sind', async () => {
    const { push, sent } = pushTo(1)
    const off = {
      weeklySummary: { ...DEFAULT_TIMING.settings.weeklySummary, isEnabled: false },
      isUrgentEnabled: false,
    }
    const { deps, mail } = setUp({ push, settings: off })

    await sendDueReminders(deps, saturdayAfterTen)
    await sendDueReminders(deps, tuesdayMorning)

    expect(sent).toEqual([])
    expect(mail.sent).toEqual([])
  })
})
