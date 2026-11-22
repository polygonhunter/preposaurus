// Fake-Adapter (AI_PROVIDER=fake): feste Antworten je Testbild und Rolle, ohne Netz und Schlüssel.
// Auch der Fake prüft jede Antwort mit dem Schema der Rolle. Eine Testantwort, die nicht passt,
// ergibt deshalb wie beim echten Adapter `invalid-response`.
import type { AiRole } from '@/shared/config/ai-roles'
import { err } from '@/shared/lib/result'
import { sha256Hex } from '../storage/photo-storage'
import { parseAnswer } from './role-schemas'
import type {
  AiFailure,
  RecognitionOutcome,
  RecognitionRequest,
  VisionRecognizer,
} from './vision-recognizer'

/** Antwort für eine Rolle, wahlweise nur für ein bestimmtes Foto (SHA-256 der Bilddaten). */
export type FakeAnswer = { role: AiRole; imageSha256?: string } & (
  { answer: unknown } | { failure: AiFailure }
)

const NOTHING_READ = { sicherheit: 'niedrig' } as const
const NO_MACROS = { kcal: null, eiweiss_g: null, kohlenhydrate_g: null, fett_g: null }
const NO_DATE = { roh_text: null, datum: null, genauigkeit: 'unbekannt', art: 'unbekannt' }

/** Ohne passende feste Antwort: „nichts erkannt“. Nie ein ausgedachter Wert. */
const NOTHING_RECOGNIZED: Readonly<Record<AiRole, unknown>> = {
  verpackung: {
    ...NOTHING_READ,
    bezeichnung: null,
    lebensmittelart: null,
    behaelter: 'sonstiges',
    inhalt: { wert: null, einheit: null },
    abtropfgewicht_g: null,
  },
  naehrwerte: { ...NOTHING_READ, ...NO_MACROS, bezug: '100g', portionsgroesse: null, kj: null },
  naehrwerte_schaetzen: { ...NOTHING_READ, ...NO_MACROS },
  mhd: { ...NOTHING_READ, ...NO_DATE },
  mhd_zweitversuch: { ...NOTHING_READ, ...NO_DATE },
}

export interface FakeVisionRecognizer extends VisionRecognizer {
  /** Alle bisherigen Anfragen, z. B. um in Tests den Zweitversuch zu prüfen */
  readonly requests: readonly RecognitionRequest<AiRole>[]
}

function findAnswer(answers: readonly FakeAnswer[], role: AiRole, imageSha256: string) {
  return answers.find(
    (candidate) =>
      candidate.role === role &&
      (candidate.imageSha256 === undefined || candidate.imageSha256 === imageSha256),
  )
}

function respond<R extends AiRole>(
  request: RecognitionRequest<R>,
  answers: readonly FakeAnswer[],
): RecognitionOutcome<R> {
  const call = { role: request.role, model: request.model, durationMs: 0 }
  const usage = { inputTokens: 0, outputTokens: 0 }
  const found = findAnswer(answers, request.role, sha256Hex(request.image.data))
  if (found && 'failure' in found) {
    return { call: { ...call, inputTokens: null, outputTokens: null }, answer: err(found.failure) }
  }
  const raw = found ? found.answer : NOTHING_RECOGNIZED[request.role]
  return { call: { ...call, ...usage }, answer: parseAnswer(request, raw) }
}

/** Die erste passende Antwort gewinnt. Antworten mit Foto-Hash also vor allgemeine stellen. */
export function createFakeVisionRecognizer(
  answers: readonly FakeAnswer[] = [],
): FakeVisionRecognizer {
  const requests: RecognitionRequest<AiRole>[] = []
  return {
    requests,
    recognize: (request) => {
      requests.push(request)
      return Promise.resolve(respond(request, answers))
    },
  }
}
