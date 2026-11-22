// Verschlüsselung der KI-Schlüssel in der DB (#108): AES-256-GCM, der Schlüssel dafür wird per
// HKDF-SHA256 aus APP_SECRET abgeleitet. `version` steckt im HKDF-`info`: Ein späterer Wechsel des
// Verfahrens oder Geheimnisses bekommt eine neue Version, alte Zeilen bleiben erkennbar. Die
// Zeilen-ID ist als AAD gebunden, damit sich ein Chiffrat nicht in eine andere Zeile kopieren lässt.
// Der Klartext erscheint nie in Fehlern oder Rückgaben, nur als SecretValue.
import 'server-only'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { err, ok, type Result } from '@/shared/lib/result'
import { SecretValue } from './secret-value'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16
const HKDF_SALT = 'preposaurus/ki-schluessel'
const HINT_LENGTH = 4

/** Aktuelle Version des Verfahrens. Neue Chiffrate entstehen immer mit dieser Version. */
export const CURRENT_SECRET_VERSION = 1

export interface EncryptedSecret {
  ciphertext: string
  iv: string
  authTag: string
  /** Letzte 4 Zeichen für die maskierte Anzeige, z. B. „…4f2a“ */
  hint: string
  version: number
}

export interface SecretBoxContext {
  appSecret: string
  /** Bindet das Chiffrat an seine Zeile (ki_verbindung.id) */
  associatedData: string
}

function deriveKey(appSecret: string, version: number): Buffer {
  const info = `aes-256-gcm/v${String(version)}`
  return Buffer.from(hkdfSync('sha256', appSecret, HKDF_SALT, info, KEY_BYTES))
}

export function encryptSecret(plaintext: string, context: SecretBoxContext): EncryptedSecret {
  const iv = randomBytes(IV_BYTES)
  const key = deriveKey(context.appSecret, CURRENT_SECRET_VERSION)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES })
  cipher.setAAD(Buffer.from(context.associatedData, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    hint: plaintext.slice(-HINT_LENGTH),
    version: CURRENT_SECRET_VERSION,
  }
}

export type EncryptedParts = Pick<EncryptedSecret, 'ciphertext' | 'iv' | 'authTag' | 'version'>

/**
 * Falsches Geheimnis, fremde Zeile oder verändertes Chiffrat ergeben denselben Fehler ohne Details.
 * GCM erkennt jede Veränderung am Auth-Tag, mehr gibt es nicht zu sagen.
 */
export function decryptSecret(
  parts: EncryptedParts,
  context: SecretBoxContext,
): Result<SecretValue, 'undecryptable'> {
  try {
    const key = deriveKey(context.appSecret, parts.version)
    const iv = Buffer.from(parts.iv, 'base64')
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES })
    decipher.setAAD(Buffer.from(context.associatedData, 'utf8'))
    decipher.setAuthTag(Buffer.from(parts.authTag, 'base64'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(parts.ciphertext, 'base64')),
      decipher.final(),
    ])
    return ok(new SecretValue(plaintext.toString('utf8')))
  } catch {
    // Absichtlich ohne Ursache: Die Meldung von node:crypto hilft niemandem weiter.
    return err('undecryptable')
  }
}
