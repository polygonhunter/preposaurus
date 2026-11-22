// Port der Foto-Erkennung (CODE_PRINZIPIEN §8, technik.html#api-ki). Der Verbraucher kennt nur
// dieses Interface. Adapter: Anthropic (#59, einzige Datei mit dem SDK) und Fake (Tests, Entwicklung).
// Je Foto-Rolle ein eigener Aufruf mit eigenem Prompt, Schema und Modell.
import type { AiRole } from '@/shared/config/ai-roles'
import type {
  BestBeforeAnswer,
  BestBeforeEstimateAnswer,
  NutritionAnswer,
  NutritionEstimateAnswer,
  PackagingAnswer,
} from '@/features/capture/schemas'
import type { Result } from '@/shared/lib/result'
import type { StoredPhotoType } from '../storage/photo-storage'

/** Ein bereits verkleinertes Foto ohne EXIF (siehe server/storage/photo-processor). */
export interface AiImage {
  data: Uint8Array
  mimeType: StoredPhotoType
}

interface FoodTypeOption {
  key: string
  name: string
}

type NoContext = Readonly<Record<string, never>>

/** Lebensmittelart und Bezeichnung aus dem Schritt Verpackung, beides darf fehlen */
interface EstimateContext {
  foodType: FoodTypeOption | null
  productName: string | null
}

/** Was jede Rolle außer dem Foto braucht. */
export interface RoleContexts {
  /** Erlaubte Lebensmittelarten des Haushalts, bei jedem Aufruf frisch aus den Stammdaten */
  verpackung: { foodTypes: readonly FoodTypeOption[] }
  naehrwerte: NoContext
  /** Grundlage der Schätzung: Lebensmittelart und Bezeichnung aus dem Schritt Verpackung */
  naehrwerte_schaetzen: EstimateContext
  mhd: NoContext
  mhd_zweitversuch: NoContext
  /** Grundlage der MHD-Schätzung: dieselben Angaben wie bei den Nährwerten (#124) */
  mhd_schaetzen: EstimateContext
}

/** Geprüfte Antwort je Rolle, Typen aus den Zod-Schemas. */
export interface RoleAnswers {
  verpackung: PackagingAnswer
  naehrwerte: NutritionAnswer
  naehrwerte_schaetzen: NutritionEstimateAnswer
  mhd: BestBeforeAnswer
  mhd_zweitversuch: BestBeforeAnswer
  mhd_schaetzen: BestBeforeEstimateAnswer
}

export interface RecognitionRequest<R extends AiRole> {
  role: R
  image: AiImage
  /** Modell-ID, gewählt vom Aufrufer (Empfehlung bzw. Einstellung je Rolle, #108) */
  model: string
  context: RoleContexts[R]
}

export type AiFailure =
  | { kind: 'timeout' }
  | { kind: 'invalid-key' }
  | { kind: 'no-credit' }
  | { kind: 'rate-limited' }
  /** Antwort passt nicht zum Schema. `issues` ist für das Protokoll, ohne Bildinhalt */
  | { kind: 'invalid-response'; issues: string }
  | { kind: 'provider-error' }

/** Für das Protokoll `ki_aufruf`, auch bei Fehlschlägen. Tokens fehlen, wenn der Anbieter keine meldet. */
export interface AiCallRecord {
  role: AiRole
  model: string
  durationMs: number
  inputTokens: number | null
  outputTokens: number | null
}

export interface RecognitionOutcome<R extends AiRole> {
  call: AiCallRecord
  answer: Result<RoleAnswers[R], AiFailure>
}

export interface VisionRecognizer {
  recognize: <R extends AiRole>(request: RecognitionRequest<R>) => Promise<RecognitionOutcome<R>>
}

/** „Verbindung testen“ (#108): ein kleiner Aufruf ohne Foto, Ergebnis nur Erfolg oder Fehlerart. */
export interface ConnectionTester {
  testConnection: (model: string) => Promise<Result<null, AiFailure>>
}
