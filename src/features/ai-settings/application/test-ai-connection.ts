// Use-Case „Verbindung testen“ (#108, DATENKATALOG §8.2 testAiConnectionAction): ein kleiner
// Testaufruf ohne Foto. Das Ergebnis ist der Status, kein Fehler. Bei einer Verbindung aus der App
// landet es in letzter_test_status/letzter_test_am. Die Verbindung „aus Umgebungsvariable“ hat
// keine Zeile und wird nur getestet.
import 'server-only'
import {
  createVisionRecognizer,
  type ProviderConnection,
} from '@/server/ai/create-vision-recognizer'
import { AI_ROLE_DEFAULT_MODELS } from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import { findConnection, saveTestResult } from '../data/ai-settings-repository'
import {
  decryptConnection,
  envConnection,
  type AiConfigDeps,
  type AiConfigError,
} from './ai-config-service'
import {
  connectionTestResult,
  type ConnectionTestResult,
  type TestOutcomeKind,
} from './connection-test-result'

interface TestAiConnectionInput {
  householdId: string
  connection: 'env' | { id: string }
  /** Ohne Angabe die Empfehlung für die Verpackung, das günstigste Modell */
  model?: string
}

export interface TestAiConnectionError {
  kind: 'not-found'
}

export interface TestAiConnectionDeps extends AiConfigDeps {
  now: () => Date
  /** Nur für Tests: Adapter ersetzen */
  createTester?: typeof createVisionRecognizer
}

interface LoadedConnection {
  id: string | null
  connection: Result<ProviderConnection, AiConfigError>
}

async function loadConnection(
  deps: TestAiConnectionDeps,
  input: TestAiConnectionInput,
): Promise<LoadedConnection | null> {
  if (input.connection === 'env') {
    const fromEnv = envConnection(deps.env)
    return fromEnv === null ? null : { id: null, connection: ok(fromEnv) }
  }
  const stored = await findConnection(deps.db, input.householdId, input.connection.id)
  if (stored === null) return null
  return { id: stored.id, connection: decryptConnection(deps.env, stored) }
}

async function runTest(
  deps: TestAiConnectionDeps,
  connection: LoadedConnection['connection'],
  model: string,
): Promise<TestOutcomeKind> {
  // Ohne lesbaren Schlüssel gibt es nichts zu testen. Eine Verbindung ganz ohne Schlüssel gilt
  // wie ein ungültiger.
  if (!connection.ok) {
    return connection.error.kind === 'key-unreadable' ? 'key-unreadable' : 'invalid-key'
  }
  const createTester = deps.createTester ?? createVisionRecognizer
  const result = await createTester(deps.env, connection.value).testConnection(model)
  return result.ok ? 'ok' : result.error.kind
}

export async function testAiConnection(
  deps: TestAiConnectionDeps,
  input: TestAiConnectionInput,
): Promise<Result<ConnectionTestResult & { testedAt: Date }, TestAiConnectionError>> {
  const loaded = await loadConnection(deps, input)
  if (loaded === null) return err({ kind: 'not-found' })
  const model = input.model ?? AI_ROLE_DEFAULT_MODELS.verpackung
  const result = connectionTestResult(await runTest(deps, loaded.connection, model))
  const testedAt = deps.now()
  if (loaded.id !== null) {
    const { householdId } = input
    const { status } = result
    await saveTestResult(deps.db, { householdId, connectionId: loaded.id, status, testedAt })
  }
  return ok({ ...result, testedAt })
}
