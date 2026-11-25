// Foto-Erkennung in der Einrichtung einrichten (#314): dieselbe Verbindung wie unter Einstellungen →
// Foto-Erkennung (addAiConnection, Schlüssel verschlüsselt, Rollen mit Empfehlung) und danach der
// Haushaltsschalter an. Keine eigene Speicherlogik. Den Namen schlägt die App vor, die Einrichtung
// fragt nur nach dem Schlüssel.
import 'server-only'
import type { Result } from '@/shared/lib/result'
import { loadHouseholdAiSettings } from '../data/ai-settings-repository'
import { suggestConnectionName } from '../domain/connection-name'
import { addAiConnection, type AddAiConnectionError } from './add-ai-connection'
import type { AiConfigDeps } from './ai-config-service'
import type { CreatedAiConnection } from './create-ai-connection'
import { setAiEnabled } from './manage-ai-connection'

type SetUpRecognitionInput = Readonly<{ householdId: string; apiKey: string }>

export async function setUpRecognition(
  deps: AiConfigDeps,
  { householdId, apiKey }: SetUpRecognitionInput,
): Promise<Result<CreatedAiConnection, AddAiConnectionError>> {
  const { connections } = await loadHouseholdAiSettings(deps.db, householdId)
  const name = suggestConnectionName(connections.map((connection) => connection.name))
  const created = await addAiConnection(deps, { householdId, provider: 'anthropic', name, apiKey })
  if (created.ok) await setAiEnabled(deps, { householdId, isEnabled: true })
  return created
}
