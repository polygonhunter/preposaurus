import { describe, expect, it } from 'vitest'
import {
  createNodemailerMailSender,
  type MailTransport,
  type SmtpConfig,
} from './nodemailer-mail-sender'

const config: SmtpConfig = {
  host: 'smtp.example.org',
  port: 587,
  secure: false,
  auth: { user: 'vorrat', password: 'geheim-fuer-tests' },
  from: 'Preposaurus <vorrat@example.org>',
}

const content = { subject: 'Betreff', text: 'Text', html: '<p>Text</p>' }

function recordingTransport() {
  const mails: Parameters<MailTransport['sendMail']>[0][] = []
  const transport: MailTransport = {
    sendMail: (mail) => {
      mails.push(mail)
      return Promise.resolve({ messageId: 'test' })
    },
  }
  return { mails, transport }
}

describe('createNodemailerMailSender', () => {
  it('gilt als eingerichtet und sendet mit dem Absender aus der Konfiguration', async () => {
    const { mails, transport } = recordingTransport()
    const sender = createNodemailerMailSender(config, transport)
    expect(sender.isConfigured).toBe(true)
    const result = await sender.send({ ...content, to: ' anna@example.org ' })
    expect(result).toEqual({ ok: true, value: null })
    expect(mails).toEqual([{ from: config.from, to: 'anna@example.org', ...content }])
  })

  it.each([
    ['ohne-at'],
    ['1b2c@nutzer.invalid'],
    [''],
    ['anna@example.org,ben@example.org'],
    ['Anna <anna@example.org>'],
  ])('überspringt die Adresse „%s“ ohne Versand', async (to) => {
    const { mails, transport } = recordingTransport()
    const result = await createNodemailerMailSender(config, transport).send({ ...content, to })
    expect(result).toEqual({ ok: false, error: { kind: 'no-recipient' } })
    expect(mails).toHaveLength(0)
  })

  it('meldet einen Fehler des Mailservers als Rückgabewert', async () => {
    const transport: MailTransport = {
      sendMail: () => Promise.reject(new Error('Verbindung abgelehnt')),
    }
    const result = await createNodemailerMailSender(config, transport).send({
      ...content,
      to: 'anna@example.org',
    })
    expect(result).toEqual({ ok: false, error: { kind: 'failed', reason: 'Verbindung abgelehnt' } })
  })

  it('nimmt Adressen aus der Antwort des Mailservers heraus', async () => {
    const transport: MailTransport = {
      sendMail: () =>
        Promise.reject(
          new Error("Can't send mail: 550 5.1.1 <anna@example.org>: Recipient address rejected"),
        ),
    }
    const result = await createNodemailerMailSender(config, transport).send({
      ...content,
      to: 'anna@example.org',
    })
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'failed',
        reason: "Can't send mail: 550 5.1.1 <<Adresse>>: Recipient address rejected",
      },
    })
  })

  it('meldet auch einen Fehler ohne Error-Objekt', async () => {
    const failing: MailTransport = {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- weil Bibliotheken auch Nicht-Errors werfen
      sendMail: () => Promise.reject('Zeitüberschreitung'),
    }
    const sender = createNodemailerMailSender(config, failing)
    expect(await sender.send({ ...content, to: 'anna@example.org' })).toEqual({
      ok: false,
      error: { kind: 'failed', reason: 'Zeitüberschreitung' },
    })
  })

  it('baut ohne Fake einen echten SMTP-Transport, ohne zu verbinden', () => {
    expect(createNodemailerMailSender({ ...config, auth: null }).isConfigured).toBe(true)
  })
})
