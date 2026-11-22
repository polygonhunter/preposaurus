// Neue KI-Verbindung mit Schlüssel anlegen (#108, DATENKATALOG §8.2 createAiConnectionAction).
// Der Schlüssel wird vor dem Speichern mit APP_SECRET verschlüsselt und an die neue Zeilen-ID
// gebunden. Zurück kommt nur der Hinweis „…4f2a“, nie der Klartext. Die Prüfung der Eingabe und
// die Rechte (nur Admin) übernimmt die spätere Action.
import 'server-only'
import { randomUUID } from 'node:crypto'
import { encryptSecret } from '@/server/crypto/secret-box'
import type { Database } from '@/server/db/connection'
import type { AI_PROVIDERS } from '@/shared/config/constants'
import type { Env } from '@/shared/config/env'
import { insertConnection } from '../data/ai-settings-repository'

interface CreateAiConnectionInput {
  householdId: string
  provider: (typeof AI_PROVIDERS)[number]
  name: string
  apiKey: string
}

export interface CreatedAiConnection {
  id: string
  keyHint: string
}

export async function createAiConnection(
  deps: { db: Database; env: Pick<Env, 'APP_SECRET'> },
  input: CreateAiConnectionInput,
): Promise<CreatedAiConnection> {
  const id = randomUUID()
  const key = encryptSecret(input.apiKey.trim(), {
    appSecret: deps.env.APP_SECRET,
    associatedData: id,
  })
  const { householdId, provider, name } = input
  await insertConnection(deps.db, { id, householdId, provider, name, key })
  return { id, keyHint: `…${key.hint}` }
}
