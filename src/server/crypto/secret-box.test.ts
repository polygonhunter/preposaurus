import { inspect } from 'node:util'
import { describe, expect, it } from 'vitest'
import { CURRENT_SECRET_VERSION, decryptSecret, encryptSecret } from './secret-box'
import { SecretValue } from './secret-value'

// Erfundener Testwert, kein echter Schlüssel.
const PLAINTEXT = 'sk-ant-test-0000000000000000-4f2a'
const CONTEXT = { appSecret: 'a'.repeat(32), associatedData: 'verbindung-1' }

function flipFirstByte(base64: string): string {
  const bytes = Buffer.from(base64, 'base64')
  bytes[0] = (bytes[0] ?? 0) ^ 0xff
  return bytes.toString('base64')
}

describe('encryptSecret und decryptSecret', () => {
  it('entschlüsselt, was sie verschlüsselt hat', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)
    const decrypted = decryptSecret(encrypted, CONTEXT)

    expect(decrypted.ok && decrypted.value.reveal()).toBe(PLAINTEXT)
  })

  it('legt Version und Hinweis mit den letzten 4 Zeichen ab', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)

    expect(encrypted.version).toBe(CURRENT_SECRET_VERSION)
    expect(encrypted.hint).toBe('4f2a')
  })

  it('enthält den Klartext in keinem gespeicherten Feld', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)
    const stored = JSON.stringify({ ...encrypted, hint: undefined })

    expect(stored).not.toContain(PLAINTEXT)
    expect(stored).not.toContain(Buffer.from(PLAINTEXT).toString('base64'))
  })

  it('nimmt für jeden Aufruf einen neuen IV', () => {
    const first = encryptSecret(PLAINTEXT, CONTEXT)
    const second = encryptSecret(PLAINTEXT, CONTEXT)

    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
  })

  it('scheitert mit einem anderen APP_SECRET', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)

    expect(decryptSecret(encrypted, { ...CONTEXT, appSecret: 'b'.repeat(32) })).toEqual({
      ok: false,
      error: 'undecryptable',
    })
  })

  it('scheitert, wenn das Chiffrat in eine andere Zeile kopiert wurde', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)

    expect(decryptSecret(encrypted, { ...CONTEXT, associatedData: 'verbindung-2' }).ok).toBe(false)
  })

  it.each([
    ['Chiffrat', 'ciphertext'],
    ['IV', 'iv'],
    ['Auth-Tag', 'authTag'],
  ] as const)('erkennt ein verändertes %s', (_label, field) => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)
    const tampered = { ...encrypted, [field]: flipFirstByte(encrypted[field]) }

    expect(decryptSecret(tampered, CONTEXT)).toEqual({ ok: false, error: 'undecryptable' })
  })

  it('lehnt einen IV mit falscher Länge ab', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)
    const shortIv = Buffer.from(encrypted.iv, 'base64').subarray(0, 8).toString('base64')

    expect(decryptSecret({ ...encrypted, iv: shortIv }, CONTEXT)).toEqual({
      ok: false,
      error: 'undecryptable',
    })
  })

  it('erkennt eine fremde Version', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)

    expect(decryptSecret({ ...encrypted, version: 2 }, CONTEXT).ok).toBe(false)
  })

  it('scheitert ohne Ausnahme an kaputtem Base64 und zu kurzem Tag', () => {
    const encrypted = encryptSecret(PLAINTEXT, CONTEXT)

    expect(decryptSecret({ ...encrypted, authTag: 'AAAA' }, CONTEXT).ok).toBe(false)
  })
})

describe('SecretValue', () => {
  const secret = new SecretValue(PLAINTEXT)

  it('verrät den Wert weder in JSON noch als Text noch in util.inspect', () => {
    const outputs = [
      JSON.stringify({ apiKey: secret }),
      String(secret),
      `Schlüssel: ${secret.toString()}`,
      inspect({ nested: { secret } }),
    ]

    for (const output of outputs) expect(output).not.toContain(PLAINTEXT)
  })

  it('gibt den Wert nur über reveal heraus', () => {
    expect(secret.reveal()).toBe(PLAINTEXT)
  })
})
