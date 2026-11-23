// Verdrahtung für die Seite „Foto-Erkennung“ und ihre Actions: DB des Serverprozesses, die Teile
// der Umgebung, die die KI-Konfiguration braucht, und die Uhr. Tests setzen eigene Werte ein.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { loadEnv } from '@/shared/config/env'
import type { TestAiConnectionDeps } from './test-ai-connection'

export type AiSettingsServices = TestAiConnectionDeps

export async function aiSettingsServices(): Promise<AiSettingsServices> {
  const { APP_SECRET, ANTHROPIC_API_KEY, AI_PROVIDER } = loadEnv()
  return {
    db: await getDb(),
    env: { APP_SECRET, ANTHROPIC_API_KEY, AI_PROVIDER },
    now: () => new Date(),
  }
}
