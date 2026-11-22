// Auswahl des Mailversands aus der Konfiguration (CODE_PRINZIPIEN §8: Factory per ENV).
// Ohne SMTP_HOST sind Mails aus, alles andere läuft weiter.
import 'server-only'
import type { Env } from '@/shared/config/env'
import { err } from '@/shared/lib/result'
import type { MailSender } from './mail-sender'
import { createNodemailerMailSender, type SmtpConfig } from './nodemailer-mail-sender'

type SmtpEnv = Pick<
  Env,
  'SMTP_HOST' | 'SMTP_PORT' | 'SMTP_SECURE' | 'SMTP_USER' | 'SMTP_PASSWORD' | 'SMTP_FROM'
>

const IMPLICIT_TLS_PORT = 465

/** null, wenn SMTP nicht eingerichtet ist. Vollständigkeit prüft schon env.ts. */
export function smtpConfigFrom(env: SmtpEnv): SmtpConfig | null {
  if (env.SMTP_HOST === undefined || env.SMTP_FROM === undefined) return null
  const auth =
    env.SMTP_USER === undefined || env.SMTP_PASSWORD === undefined
      ? null
      : { user: env.SMTP_USER, password: env.SMTP_PASSWORD }
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === IMPLICIT_TLS_PORT,
    auth,
    from: env.SMTP_FROM,
  }
}

const notConfigured: MailSender = {
  isConfigured: false,
  send: () => Promise.resolve(err({ kind: 'not-configured' })),
}

export function createMailSender(env: SmtpEnv): MailSender {
  const config = smtpConfigFrom(env)
  return config === null ? notConfigured : createNodemailerMailSender(config)
}
