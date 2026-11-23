// Use-Case Check-in-Mail (M11-05, ERI-06): wöchentlich oder monatlich ein freundlicher Blick in
// den Vorrat, nur an Nutzer, die sie eingeschaltet haben und eine echte Adresse hinterlegt haben.
// Den Zeitpunkt legt der Zeitplan des Workers fest, deshalb braucht sie keinen Merker.
import 'server-only'
import type { DueGroup } from '@/features/inventory/domain/due-bundles'
import type { MailSender } from '@/server/notify/mail-sender'
import { checkInMail } from '@/server/notify/mail-templates'
import { sendMailToAll } from '@/server/notify/send-mail-to-all'
import { todayInBerlin } from '@/shared/lib/dates'
import type { Logger } from '@/shared/lib/logger'
import type { DueItem } from '../domain/message'
import type { CheckInCadence, CheckInRecipient, ReminderRepository } from './reminder-repository'
import { loadReminderStock, type ReminderStockDeps } from './reminder-stock'

export interface CheckInDeps extends ReminderStockDeps {
  repository: ReminderRepository
  mail: MailSender
  appUrl: string | null
  logger: Logger
}

const DUE_SOON: readonly DueGroup[] = ['this-week', 'this-month']

const labelsIn = (items: readonly DueItem[], groups: readonly DueGroup[]) =>
  items.filter((item) => groups.includes(item.group)).map((item) => item.label)

function addressesByHousehold(recipients: readonly CheckInRecipient[]): Map<string, string[]> {
  const byHousehold = new Map<string, string[]>()
  for (const { householdId, address } of recipients) {
    byHousehold.set(householdId, [...(byHousehold.get(householdId) ?? []), address])
  }
  return byHousehold
}

interface HouseholdMail {
  householdId: string
  addresses: readonly string[]
  now: Date
}

async function mailHousehold(deps: CheckInDeps, { householdId, addresses, now }: HouseholdMail) {
  const { dueItems } = await loadReminderStock(deps, householdId, todayInBerlin(now))
  const content = checkInMail({
    expired: labelsIn(dueItems, ['expired']),
    dueSoon: labelsIn(dueItems, DUE_SOON),
    appUrl: deps.appUrl,
  })
  const result = await sendMailToAll(deps.mail, addresses, content)
  if (result.ok) deps.logger.info('Check-in-Mail gesendet', { householdId, ...result.value })
}

interface CheckInRun {
  cadence: CheckInCadence
  now: Date
}

export async function sendCheckInMails(deps: CheckInDeps, { cadence, now }: CheckInRun) {
  if (!deps.mail.isConfigured) {
    deps.logger.debug('Check-in-Mail übersprungen, Mailversand ist nicht eingerichtet')
    return
  }
  const recipients = await deps.repository.listCheckInRecipients(cadence)
  for (const [householdId, addresses] of addressesByHousehold(recipients)) {
    await mailHousehold(deps, { householdId, addresses, now })
  }
}
