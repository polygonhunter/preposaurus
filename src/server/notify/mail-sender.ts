// Port für den Mailversand (CODE_PRINZIPIEN §8). Mail ist optional: Ohne SMTP-Angaben meldet der
// Port „nicht eingerichtet“, und Nutzer ohne echte Adresse werden übersprungen (#87).
import type { Result } from '@/shared/lib/result'

/** Eine fertige Mail, immer als Text und als schlichtes HTML. */
export interface MailContent {
  subject: string
  text: string
  html: string
}

export interface MailMessage extends MailContent {
  to: string
}

type MailError =
  { kind: 'not-configured' } | { kind: 'no-recipient' } | { kind: 'failed'; reason: string }

export interface MailSender {
  /** false, wenn SMTP fehlt. Dann liefert `send` immer `not-configured`. */
  isConfigured: boolean
  send: (message: MailMessage) => Promise<Result<null, MailError>>
}

// Better Auth verlangt eine E-Mail je Nutzer. Die App trägt dafür `<id>@nutzer.invalid` ein
// (05, Konto). Die Endung .invalid ist nach RFC 2606 nie zustellbar.
const TECHNICAL_DOMAIN = /\.invalid$/i
const ADDRESS_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Eine Adresse, an die sich wirklich senden lässt: vorhanden, plausibel, nicht technisch. */
export function isDeliverableAddress(address: string | null | undefined): address is string {
  if (address === null || address === undefined) return false
  const trimmed = address.trim()
  return ADDRESS_SHAPE.test(trimmed) && !TECHNICAL_DOMAIN.test(trimmed)
}
