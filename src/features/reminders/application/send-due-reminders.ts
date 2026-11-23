// Use-Case Wochenübersicht und „Dringend“ (M11-05, ERI-02, ERI-03): Der Worker ruft ihn alle paar
// Minuten auf. Je Haushalt entscheidet `planReminder`, ob jetzt etwas hinausgeht. Zugestellt wird
// per Push an alle Geräte des Haushalts. Ohne angenommenes Push geht die Wochenübersicht als Mail
// an die Nutzer mit echter Adresse, „Dringend“ nur per Push. Die Merker werden erst gesetzt, wenn
// die Nachricht wirklich angekommen ist, sonst versucht es der nächste Lauf am selben Tag erneut.
import 'server-only'
import type { MailSender } from '@/server/notify/mail-sender'
import { weeklySummaryMail } from '@/server/notify/mail-templates'
import { sendMailToAll } from '@/server/notify/send-mail-to-all'
import { todayInBerlin } from '@/shared/lib/dates'
import type { Logger } from '@/shared/lib/logger'
import { dueReminderKind, planReminder, type ReminderPlan } from '../domain/plan-reminder'
import type { HouseholdReminderState, ReminderRepository } from './reminder-repository'
import type { ReminderPush } from './reminder-push'
import { loadReminderStock, type ReminderStockDeps } from './reminder-stock'

export interface ReminderDeps extends ReminderStockDeps {
  repository: ReminderRepository
  push: ReminderPush
  mail: MailSender
  /** Adresse der App für den Link in der Mail (APP_URL), ohne sie kein Link */
  appUrl: string | null
  logger: Logger
}

interface Delivery {
  push: number
  mail: number
}

async function deliverByMail(deps: ReminderDeps, householdId: string, plan: ReminderPlan) {
  if (plan.message.kind !== 'weekly-summary') return 0
  const addresses = await deps.repository.listAddresses(householdId)
  const content = weeklySummaryMail({ lines: plan.message.lines, appUrl: deps.appUrl })
  const result = await sendMailToAll(deps.mail, addresses, content)
  if (!result.ok) return 0
  const { sent, failures } = result.value
  if (failures.length > 0) {
    deps.logger.warn('Wochenübersicht ging nicht an alle Adressen', { householdId, failures })
  }
  return sent
}

async function deliver(deps: ReminderDeps, householdId: string, plan: ReminderPlan) {
  const push = await deps.push.deliver(householdId, plan.message)
  const mail = push > 0 ? 0 : await deliverByMail(deps, householdId, plan)
  return { push, mail } satisfies Delivery
}

async function remindHousehold(deps: ReminderDeps, state: HouseholdReminderState, now: Date) {
  const { householdId } = state
  const timing = { ...state, now }
  if (dueReminderKind(timing) === null) return
  const stock = await loadReminderStock(deps, householdId, todayInBerlin(now))
  const plan = planReminder({ ...timing, stock })
  if (plan === null) return
  const delivery = await deliver(deps, householdId, plan)
  const context = { householdId, kind: plan.message.kind, ...delivery }
  if (delivery.push + delivery.mail === 0) {
    deps.logger.debug('Erinnerung hatte keinen Empfänger', context)
    return
  }
  await deps.repository.markSent(householdId, plan.marks, now)
  deps.logger.info('Erinnerung gesendet', context)
}

export async function sendDueReminders(deps: ReminderDeps, now: Date): Promise<void> {
  const households = await deps.repository.listHouseholds()
  for (const state of households) await remindHousehold(deps, state, now)
}
