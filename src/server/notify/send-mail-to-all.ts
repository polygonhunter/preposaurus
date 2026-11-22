// Eine Mail an mehrere Nutzer, je Empfänger einzeln (keine Adressen der anderen im Kopf).
// Nutzer ohne echte Adresse werden still übersprungen, denn eine E-Mail ist nie Pflicht (#87).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { isDeliverableAddress, type MailContent, type MailSender } from './mail-sender'

export interface MailDelivery {
  sent: number
  skipped: number
  /** Gründe der Fehlschläge, ohne Adressen, damit sie ins Log dürfen */
  failures: string[]
}

export async function sendMailToAll(
  sender: MailSender,
  addresses: readonly (string | null)[],
  content: MailContent,
): Promise<Result<MailDelivery, { kind: 'not-configured' }>> {
  if (!sender.isConfigured) return err({ kind: 'not-configured' })
  const recipients = addresses.filter(isDeliverableAddress)
  const delivery: MailDelivery = {
    sent: 0,
    skipped: addresses.length - recipients.length,
    failures: [],
  }
  for (const to of recipients) {
    const result = await sender.send({ ...content, to })
    if (result.ok) delivery.sent += 1
    else
      delivery.failures.push(
        result.error.kind === 'failed' ? result.error.reason : result.error.kind,
      )
  }
  return ok(delivery)
}
