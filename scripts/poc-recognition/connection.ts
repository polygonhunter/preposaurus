// Verbindung zur KI für das Messskript: über die Factory der App, also denselben Anthropic-Adapter
// (bzw. den Fake bei AI_PROVIDER=fake). Ohne Schlüssel bricht das Skript mit klarer Meldung ab.
import { SecretValue } from '../../src/server/crypto/secret-value'
import { createVisionRecognizer } from '../../src/server/ai/create-vision-recognizer'
import type { VisionRecognizer } from '../../src/server/ai/vision-recognizer'
import type { RecognitionPocEnv } from '../../src/shared/config/env'
import { err, ok, type Result } from '../../src/shared/lib/result'

export const MISSING_KEY = `ANTHROPIC_API_KEY fehlt. Bitte in .env eintragen (Anleitung: docs/POC_ERKENNUNG.md).
Trockenlauf ohne Schlüssel und ohne Kosten: AI_PROVIDER=fake npm run poc:recognition`

export interface PocConnection {
  recognizer: VisionRecognizer
  isDryRun: boolean
}

export function connectRecognizer(env: RecognitionPocEnv): Result<PocConnection, string> {
  if (env.AI_PROVIDER === 'fake') {
    const connection = { provider: 'fake' as const, apiKey: new SecretValue(''), baseUrl: null }
    return ok({
      recognizer: createVisionRecognizer({ AI_PROVIDER: 'fake' }, connection),
      isDryRun: true,
    })
  }
  if (env.ANTHROPIC_API_KEY === undefined) return err(MISSING_KEY)
  const connection = {
    provider: 'anthropic' as const,
    apiKey: new SecretValue(env.ANTHROPIC_API_KEY),
    baseUrl: null,
  }
  return ok({
    recognizer: createVisionRecognizer({ AI_PROVIDER: 'anthropic' }, connection),
    isDryRun: false,
  })
}
