import { describe, expect, it } from 'vitest'
import { createFakeMailSender } from '../../../tests/helpers/fake-mail-sender'
import { isDeliverableAddress, type MailSender } from './mail-sender'
import { sendMailToAll } from './send-mail-to-all'

const content = { subject: 'Betreff', text: 'Text', html: '<p>Text</p>' }

describe('sendMailToAll', () => {
  it('sendet je Empfänger eine Mail und überspringt Nutzer ohne echte Adresse', async () => {
    const sender = createFakeMailSender()
    const result = await sendMailToAll(
      sender,
      ['anna@example.org', null, '9f3a@nutzer.invalid', 'ben@example.org'],
      content,
    )
    expect(result).toEqual({ ok: true, value: { sent: 2, skipped: 2, failures: [] } })
    expect(sender.sent.map((mail) => mail.to)).toEqual(['anna@example.org', 'ben@example.org'])
  })

  it('sammelt Fehlschläge ohne Adressen und sendet an die übrigen weiter', async () => {
    const sender = createFakeMailSender({ failFor: ['anna@example.org'] })
    const result = await sendMailToAll(sender, ['anna@example.org', 'ben@example.org'], content)
    expect(result).toEqual({
      ok: true,
      value: { sent: 1, skipped: 0, failures: ['Mailserver nicht erreichbar'] },
    })
  })

  it('nennt die Art eines Fehlers ohne Grund', async () => {
    const sender: MailSender = {
      isConfigured: true,
      send: () => Promise.resolve({ ok: false, error: { kind: 'no-recipient' } }),
    }
    const result = await sendMailToAll(sender, ['anna@example.org'], content)
    expect(result).toEqual({ ok: true, value: { sent: 0, skipped: 0, failures: ['no-recipient'] } })
  })

  it('meldet „nicht eingerichtet“, ohne etwas zu versuchen', async () => {
    const sender: MailSender = {
      isConfigured: false,
      send: () => Promise.reject(new Error('darf nicht aufgerufen werden')),
    }
    expect(await sendMailToAll(sender, ['anna@example.org'], content)).toEqual({
      ok: false,
      error: { kind: 'not-configured' },
    })
  })
})

describe('isDeliverableAddress', () => {
  it.each([
    ['anna@example.org', true],
    [' anna@example.org ', true],
    ['1b2c@nutzer.invalid', false],
    ['ohne-at', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('%s ist zustellbar: %s', (address, expected) => {
    expect(isDeliverableAddress(address)).toBe(expected)
  })
})
