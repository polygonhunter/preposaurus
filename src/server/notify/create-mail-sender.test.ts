import { describe, expect, it } from 'vitest'
import { createMailSender, smtpConfigFrom } from './create-mail-sender'

const smtp = {
  SMTP_HOST: 'smtp.example.org',
  SMTP_PORT: 587,
  SMTP_SECURE: undefined,
  SMTP_USER: 'vorrat',
  SMTP_PASSWORD: 'geheim-fuer-tests',
  SMTP_FROM: 'vorrat@example.org',
}

const withoutSmtp = {
  SMTP_HOST: undefined,
  SMTP_PORT: 587,
  SMTP_SECURE: undefined,
  SMTP_USER: undefined,
  SMTP_PASSWORD: undefined,
  SMTP_FROM: undefined,
}

describe('smtpConfigFrom', () => {
  it('ist ohne SMTP_HOST null', () => {
    expect(smtpConfigFrom(withoutSmtp)).toBeNull()
  })

  it('übernimmt Server, Anmeldung und Absender', () => {
    expect(smtpConfigFrom(smtp)).toEqual({
      host: 'smtp.example.org',
      port: 587,
      secure: false,
      auth: { user: 'vorrat', password: 'geheim-fuer-tests' },
      from: 'vorrat@example.org',
    })
  })

  it('nutzt TLS von Anfang an auf Port 465, wenn nichts anderes gesetzt ist', () => {
    expect(smtpConfigFrom({ ...smtp, SMTP_PORT: 465 })?.secure).toBe(true)
    expect(smtpConfigFrom({ ...smtp, SMTP_PORT: 465, SMTP_SECURE: false })?.secure).toBe(false)
  })

  it('verbindet ohne Anmeldung, wenn Nutzer und Passwort fehlen', () => {
    const config = smtpConfigFrom({ ...smtp, SMTP_USER: undefined, SMTP_PASSWORD: undefined })
    expect(config?.auth).toBeNull()
  })
})

describe('createMailSender', () => {
  it('meldet ohne SMTP „nicht eingerichtet“', async () => {
    const sender = createMailSender(withoutSmtp)
    expect(sender.isConfigured).toBe(false)
    expect(
      await sender.send({ to: 'anna@example.org', subject: 's', text: 't', html: 'h' }),
    ).toEqual({
      ok: false,
      error: { kind: 'not-configured' },
    })
  })

  it('nutzt mit SMTP den Nodemailer-Adapter', () => {
    expect(createMailSender(smtp).isConfigured).toBe(true)
  })
})
