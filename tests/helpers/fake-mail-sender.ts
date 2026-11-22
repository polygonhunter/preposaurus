// Fake für den Mailversand (UMSETZUNG Grundentscheidung 12): merkt sich jede Mail statt sie zu
// senden. Prüft Empfänger wie der echte Adapter.
import {
  isDeliverableAddress,
  type MailMessage,
  type MailSender,
} from '../../src/server/notify/mail-sender'
import { err, ok } from '../../src/shared/lib/result'

export interface FakeMailSender extends MailSender {
  sent: MailMessage[]
}

interface FakeOptions {
  /** Empfänger, bei denen der Versand scheitert */
  failFor?: readonly string[]
}

export function createFakeMailSender({ failFor = [] }: FakeOptions = {}): FakeMailSender {
  const sent: MailMessage[] = []
  return {
    isConfigured: true,
    sent,
    send(message) {
      if (!isDeliverableAddress(message.to)) return Promise.resolve(err({ kind: 'no-recipient' }))
      if (failFor.includes(message.to)) {
        return Promise.resolve(err({ kind: 'failed', reason: 'Mailserver nicht erreichbar' }))
      }
      sent.push(message)
      return Promise.resolve(ok(null))
    },
  }
}
