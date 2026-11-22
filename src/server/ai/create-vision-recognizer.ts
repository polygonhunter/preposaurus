// Factory für den Adapter einer Verbindung (CODE_PRINZIPIEN §8). AI_PROVIDER=fake liefert in
// Entwicklung und Tests den Fake ohne Netz. Die Begrenzung der Gleichzeitigkeit gilt für den ganzen
// Serverprozess, nicht je Verbindung, weil jede Anfrage einen frischen Adapter baut.
import 'server-only'
import type { AI_PROVIDERS } from '@/shared/config/constants'
import type { Env } from '@/shared/config/env'
import { ok } from '@/shared/lib/result'
import type { SecretValue } from '../crypto/secret-value'
import { createAnthropicAdapter } from './anthropic-adapter'
import { createConcurrencyLimit } from './concurrency-limit'
import { createFakeVisionRecognizer } from './fake-vision-recognizer'
import type { ConnectionTester, VisionRecognizer } from './vision-recognizer'

// Klein gehalten für das NAS: eine MHD-Serie läuft so in Zweierschritten.
const MAX_CONCURRENT_AI_CALLS = 2
const processLimit = createConcurrencyLimit(MAX_CONCURRENT_AI_CALLS)

export interface ProviderConnection {
  provider: (typeof AI_PROVIDERS)[number]
  apiKey: SecretValue
  baseUrl: string | null
}

export function createVisionRecognizer(
  env: Pick<Env, 'AI_PROVIDER'>,
  connection: ProviderConnection,
): VisionRecognizer & ConnectionTester {
  if (env.AI_PROVIDER === 'fake') {
    return { ...createFakeVisionRecognizer(), testConnection: () => Promise.resolve(ok(null)) }
  }
  // Bisher gibt es nur Anthropic (AI_PROVIDERS). Ein weiterer Anbieter verzweigt hier.
  return createAnthropicAdapter({
    apiKey: connection.apiKey,
    baseUrl: connection.baseUrl,
    limit: processLimit,
  })
}
