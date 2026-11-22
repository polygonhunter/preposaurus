// Zufällige UUID v4 im Browser, z. B. als Idempotenz-Schlüssel einer Erfassung. crypto.randomUUID
// gibt es nur in sicheren Kontexten (HTTPS, localhost). Ruft jemand die App im Heimnetz über
// http://<IP> auf, bleibt getRandomValues, das überall vorhanden ist.
type RandomSource = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>

const VERSION_4 = 0x40
const VARIANT_RFC = 0x80

function uuidFromBytes(bytes: Uint8Array): string {
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | VERSION_4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | VARIANT_RFC
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function createUuid(source: RandomSource = globalThis.crypto): string {
  if (typeof source.randomUUID === 'function') return source.randomUUID()
  return uuidFromBytes(source.getRandomValues(new Uint8Array(16)))
}
