// Adapter: Mailversand über SMTP mit Nodemailer (MIT-0). Einzige Datei, die Nodemailer kennt.
import 'server-only'
import { createTransport } from 'nodemailer'
import { err, ok } from '@/shared/lib/result'
import { isDeliverableAddress, type MailMessage, type MailSender } from './mail-sender'

export interface SmtpConfig {
  host: string
  port: number
  /** TLS von Anfang an (Port 465). Sonst STARTTLS, sobald der Server es anbietet. */
  secure: boolean
  /** null: Server ohne Anmeldung (z. B. Relay im eigenen Netz) */
  auth: { user: string; password: string } | null
  /** Absender, z. B. „Preposaurus <vorrat@example.org>“ */
  from: string
}

interface TransportMail {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

/** Was der Adapter von Nodemailer braucht. Tests geben einen Fake-Transport hinein. */
export interface MailTransport {
  sendMail: (mail: TransportMail) => Promise<unknown>
}

// Ein hängender Mailserver soll den Worker nicht aufhalten.
const SMTP_TIMEOUT_MS = 15_000

function createSmtpTransport(config: SmtpConfig): MailTransport {
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    ...(config.auth === null
      ? {}
      : { auth: { user: config.auth.user, pass: config.auth.password } }),
  })
}

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function createNodemailerMailSender(
  config: SmtpConfig,
  transport: MailTransport = createSmtpTransport(config),
): MailSender {
  return {
    isConfigured: true,
    async send(message: MailMessage) {
      if (!isDeliverableAddress(message.to)) return err({ kind: 'no-recipient' })
      const { to, subject, text, html } = message
      try {
        await transport.sendMail({ from: config.from, to: to.trim(), subject, text, html })
        return ok(null)
      } catch (error: unknown) {
        // Grenze zum Mailserver (CODE_PRINZIPIEN §6): Der Aufrufer protokolliert den Grund.
        return err({ kind: 'failed', reason: reasonOf(error) })
      }
    },
  }
}
