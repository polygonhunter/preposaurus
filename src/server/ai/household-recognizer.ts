// Ein VisionRecognizer für einen Haushalt: leitet jede Rolle an den Adapter ihrer Verbindung weiter
// (#108, je Rolle eine eigene Verbindung möglich) und schreibt jeden Aufruf ins Protokoll ki_aufruf,
// auch Fehlschläge. Der Verbraucher (z. B. recognizeBestBefore) merkt davon nichts.
import 'server-only'
import type { AiRole } from '@/shared/config/ai-roles'
import type { AI_CONFIDENCE_LEVELS } from '@/shared/config/constants'
import { estimateCostUsd } from './model-prices'
import type {
  AiCallRecord,
  AiFailure,
  RecognitionOutcome,
  RecognitionRequest,
  VisionRecognizer,
} from './vision-recognizer'

/** Eine Zeile in ki_aufruf. Nie mit Schlüssel oder Bildinhalt. */
export interface AiCallEntry extends AiCallRecord {
  householdId: string
  photoId: string | null
  /** null bei der Verbindung „aus Umgebungsvariable“ */
  connectionId: string | null
  /** 2 nur beim MHD-Zweitversuch (#114) */
  attempt: 1 | 2
  costUsd: number | null
  confidence: (typeof AI_CONFIDENCE_LEVELS)[number] | null
  isSuccess: boolean
  errorKind: AiFailure['kind'] | null
}

export interface AiCallLog {
  record: (entry: AiCallEntry) => Promise<void>
}

export interface RoleRoute {
  recognizer: VisionRecognizer
  connectionId: string | null
}

interface HouseholdRecognizerOptions {
  householdId: string
  photoId: string | null
  /** Nur Rollen, die eingerichtet und aktiv sind */
  routes: Partial<Record<AiRole, RoleRoute>>
  log: AiCallLog
}

const attemptForRole = (role: AiRole): 1 | 2 => (role === 'mhd_zweitversuch' ? 2 : 1)

function toEntry<R extends AiRole>(
  outcome: RecognitionOutcome<R>,
  options: HouseholdRecognizerOptions,
  connectionId: string | null,
): AiCallEntry {
  const { answer, call } = outcome
  return {
    ...call,
    householdId: options.householdId,
    photoId: options.photoId,
    connectionId,
    attempt: attemptForRole(call.role),
    costUsd: estimateCostUsd(call.model, call),
    confidence: answer.ok ? answer.value.sicherheit : null,
    isSuccess: answer.ok,
    errorKind: answer.ok ? null : answer.error.kind,
  }
}

export function createHouseholdRecognizer(options: HouseholdRecognizerOptions): VisionRecognizer {
  return {
    recognize: async <R extends AiRole>(request: RecognitionRequest<R>) => {
      const route = options.routes[request.role]
      // Der Aufrufer fragt nur Rollen an, die der Konfigurations-Service freigegeben hat.
      if (route === undefined) throw new Error(`KI-Rolle ${request.role} ist nicht eingerichtet`)
      const outcome = await route.recognizer.recognize(request)
      await options.log.record(toEntry(outcome, options, route.connectionId))
      return outcome
    },
  }
}
