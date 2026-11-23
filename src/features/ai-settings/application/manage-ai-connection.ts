// Haushaltsschalter, Schlüssel ersetzen und Verbindung entfernen (#108, #79). Prüfung der Eingabe
// und Rechte übernehmen die Actions. Der neue Schlüssel wird wie beim Anlegen verschlüsselt und an
// die Zeilen-ID gebunden, zurück kommt nur der Hinweis „…4f2a“.
import 'server-only'
import { encryptSecret } from '@/server/crypto/secret-box'
import type { Database } from '@/server/db/connection'
import type { Env } from '@/shared/config/env'
import { err, ok, type Result } from '@/shared/lib/result'
import { deleteConnection, replaceConnectionKey, saveAiEnabled } from '../data/ai-settings-writes'

export interface ConnectionNotFound {
  kind: 'not-found'
}

type ConnectionTarget = Readonly<{ householdId: string; connectionId: string }>

export async function setAiEnabled(
  deps: { db: Database },
  change: Readonly<{ householdId: string; isEnabled: boolean }>,
): Promise<void> {
  await saveAiEnabled(deps.db, change)
}

export async function replaceAiKey(
  deps: { db: Database; env: Pick<Env, 'APP_SECRET'> },
  input: ConnectionTarget & Readonly<{ apiKey: string }>,
): Promise<Result<{ keyHint: string }, ConnectionNotFound>> {
  const { householdId, connectionId } = input
  const key = encryptSecret(input.apiKey.trim(), {
    appSecret: deps.env.APP_SECRET,
    associatedData: connectionId,
  })
  const isReplaced = await replaceConnectionKey(deps.db, { householdId, connectionId, key })
  return isReplaced ? ok({ keyHint: `…${key.hint}` }) : err({ kind: 'not-found' })
}

export async function removeAiConnection(
  deps: { db: Database },
  target: ConnectionTarget,
): Promise<Result<null, ConnectionNotFound>> {
  return (await deleteConnection(deps.db, target)) ? ok(null) : err({ kind: 'not-found' })
}
