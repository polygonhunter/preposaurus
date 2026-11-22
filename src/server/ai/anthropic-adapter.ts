// Anthropic-Adapter (M6-05, #59): einzige Datei, die das SDK kennt. Je Foto-Rolle ein Aufruf mit
// Structured Outputs (output_config.format, Schema aus capture/schemas/ai-answers.ts), Foto als
// Base64 vor dem Text. Denken und Effort je Modell (model-reasoning.ts). Zeitlimit je Versuch und für die ganze
// Erkennung, höchstens eine Wiederholung bei 429 und 5xx außer 504 (die eingebaute Wiederholung des
// SDK ist aus, weil sie auch Zeitüberschreitungen wiederholt), begrenzte Gleichzeitigkeit nur für
// laufende Anfragen. Fehler werden auf AiFailure abgebildet. Der Schlüssel steht nie in einer
// Rückgabe oder einem Fehler. Geprüft gegen die Doku vom 2026-11-22 (SDK 1.12.0).
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { AiRole } from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import type { SecretValue } from '../crypto/secret-value'
import { canonicalizeEnums } from './canonical-enums'
import type { ConcurrencyLimit } from './concurrency-limit'
import { reasoningFor } from './model-reasoning'
import { outputJsonSchema, type OutputJsonSchema } from './output-schema'
import { promptForRole } from './prompts'
import { retryDelayFromHeader } from './retry-after'
import { retryOnce, sleep as waitFor } from './retry-once'
import { parseAnswer } from './role-schemas'
import type {
  AiFailure,
  ConnectionTester,
  RecognitionOutcome,
  RecognitionRequest,
  VisionRecognizer,
} from './vision-recognizer'

// Ein Versuch darf dauern, solange Sonnet 5.5 mit Effort medium über einem Foto nachdenkt. Die
// ganze Erkennung (Warteschlange, Versuch, Pause, Wiederholung) bleibt unter einer Minute.
const ATTEMPT_TIMEOUT_MS = 45_000
const TOTAL_TIMEOUT_MS = 60_000
// Darunter lohnt kein Versuch mehr, das Ergebnis wäre ohnehin eine Zeitüberschreitung.
const MIN_ATTEMPT_MS = 1_000
// Nur eine Obergrenze, berechnet werden die tatsächlich erzeugten Tokens. Denk-Tokens zählen mit.
// 16.000 lassen Sonnet mit adaptivem Denken genug Luft und bleiben im Rahmen, den das SDK ohne
// Streaming annimmt.
const MAX_OUTPUT_TOKENS = 16_000
const TEST_MAX_TOKENS = 16

export interface AnthropicAdapterOptions {
  apiKey: SecretValue
  /** Anderer Endpunkt (basis_url der Verbindung), sonst der Standard des SDK */
  baseUrl: string | null
  limit: ConcurrencyLimit
  attemptTimeoutMs?: number
  totalTimeoutMs?: number
  /** Nur für Tests: HTTP-Ebene ersetzen bzw. Wartezeit überspringen */
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

interface CallError {
  failure: AiFailure
  /** null: nicht wiederholen */
  retryDelayMs: number | null
}

const TIMED_OUT: CallError = { failure: { kind: 'timeout' }, retryDelayMs: null }

/** Reihenfolge von spezifisch nach allgemein, Unterklassen vor ihren Oberklassen. */
function failureFor(error: unknown): AiFailure {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return { kind: 'timeout' }
  if (error instanceof Anthropic.GatewayTimeoutError) return { kind: 'timeout' }
  if (error instanceof Anthropic.AuthenticationError) return { kind: 'invalid-key' }
  if (error instanceof Anthropic.PermissionDeniedError) return { kind: 'invalid-key' }
  if (error instanceof Anthropic.PaymentRequiredError) return { kind: 'no-credit' }
  if (error instanceof Anthropic.RateLimitError) return { kind: 'rate-limited' }
  return { kind: 'provider-error' }
}

// 504 ist eine Zeitüberschreitung beim Anbieter und wird wie das eigene Zeitlimit nicht wiederholt.
type RetryableError =
  InstanceType<typeof Anthropic.RateLimitError> | InstanceType<typeof Anthropic.InternalServerError>

const isRetryable = (error: unknown): error is RetryableError =>
  error instanceof Anthropic.RateLimitError ||
  (error instanceof Anthropic.InternalServerError &&
    !(error instanceof Anthropic.GatewayTimeoutError))

const retryAfterHeader = (headers: Headers | undefined) => headers?.get('retry-after')

function classify(error: unknown): CallError {
  // Kein Fehler des Anbieters, sondern ein Programmfehler: weiterwerfen (CODE_PRINZIPIEN §6).
  if (!(error instanceof Anthropic.APIError)) throw error
  const retryDelayMs = isRetryable(error)
    ? retryDelayFromHeader(retryAfterHeader(error.headers))
    : null
  return { failure: failureFor(error), retryDelayMs }
}

type CreateParams = Anthropic.MessageCreateParamsNonStreaming

function reasoningParams(model: string): Pick<CreateParams, 'thinking'> & { effort?: 'medium' } {
  const reasoning = reasoningFor(model)
  return {
    ...(reasoning.disableThinking ? { thinking: { type: 'disabled' } } : {}),
    ...(reasoning.effort === null ? {} : { effort: reasoning.effort }),
  }
}

function requestParams<R extends AiRole>(
  request: RecognitionRequest<R>,
  schema: OutputJsonSchema,
): CreateParams {
  const prompt = promptForRole(request)
  const image: Anthropic.ImageBlockParam = {
    type: 'image',
    source: {
      type: 'base64',
      media_type: request.image.mimeType,
      data: Buffer.from(request.image.data).toString('base64'),
    },
  }
  const { effort, ...thinking } = reasoningParams(request.model)
  return {
    model: request.model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: prompt.system,
    messages: [{ role: 'user', content: [image, { type: 'text', text: prompt.instruction }] }],
    ...thinking,
    output_config: { format: { type: 'json_schema', schema }, ...(effort ? { effort } : {}) },
  }
}

function invalid(issues: string): Result<never, AiFailure> {
  return err({ kind: 'invalid-response', issues })
}

function readAnswer<R extends AiRole>(
  message: Anthropic.Message,
  request: RecognitionRequest<R>,
  schema: OutputJsonSchema,
) {
  // Laut Doku passt die Antwort bei refusal und max_tokens nicht sicher zum Schema.
  if (message.stop_reason === 'refusal') return invalid('Anfrage vom Anbieter abgelehnt (refusal)')
  if (message.stop_reason === 'max_tokens') return invalid('Antwort abgeschnitten (max_tokens)')
  const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
  try {
    return parseAnswer(request, canonicalizeEnums(schema, JSON.parse(text) as unknown))
  } catch {
    return invalid('Antwort ist kein gültiges JSON')
  }
}

type Caller = (params: CreateParams) => Promise<Result<Anthropic.Message, CallError>>

function createClient(options: AnthropicAdapterOptions): Anthropic {
  return new Anthropic({
    apiKey: options.apiKey.reveal(),
    baseURL: options.baseUrl,
    maxRetries: 0,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  })
}

/**
 * Jeder Aufruf bekommt eine Frist für alles zusammen. Nur der laufende Versuch belegt einen Platz
 * der Parallel-Grenze, die Pause vor der Wiederholung nicht.
 */
function createCaller(options: AnthropicAdapterOptions): Caller {
  const client = createClient(options)
  const attemptTimeoutMs = options.attemptTimeoutMs ?? ATTEMPT_TIMEOUT_MS
  return (params) => {
    const deadline = performance.now() + (options.totalTimeoutMs ?? TOTAL_TIMEOUT_MS)
    const remainingMs = () => deadline - performance.now()
    const attempt = () =>
      options.limit(async (): Promise<Result<Anthropic.Message, CallError>> => {
        const remaining = Math.floor(remainingMs())
        if (remaining < MIN_ATTEMPT_MS) return err(TIMED_OUT)
        const timeout = Math.min(attemptTimeoutMs, remaining)
        try {
          return ok(await client.messages.create(params, { timeout }))
        } catch (error) {
          return err(classify(error))
        }
      })
    const retryDelayMs = ({ retryDelayMs: delay }: CallError) =>
      delay !== null && delay + MIN_ATTEMPT_MS <= remainingMs() ? delay : null
    return retryOnce(attempt, { retryDelayMs, sleep: options.sleep ?? waitFor })
  }
}

/** Dauer samt einer etwaigen Wiederholung. Tokens nur aus der erfolgreichen Antwort. */
async function recognizeWith<R extends AiRole>(
  call: Caller,
  request: RecognitionRequest<R>,
): Promise<RecognitionOutcome<R>> {
  const schema = outputJsonSchema(request)
  const startedAt = performance.now()
  const result = await call(requestParams(request, schema))
  const base = { role: request.role, model: request.model }
  const durationMs = Math.round(performance.now() - startedAt)
  if (!result.ok) {
    const record = { ...base, durationMs, inputTokens: null, outputTokens: null }
    return { call: record, answer: err(result.error.failure) }
  }
  const { input_tokens: inputTokens, output_tokens: outputTokens } = result.value.usage
  return {
    call: { ...base, durationMs, inputTokens, outputTokens },
    answer: readAnswer(result.value, request, schema),
  }
}

/** Kleinster sinnvoller Aufruf: prüft Schlüssel, Guthaben und Modell, ohne Foto. */
async function testWith(call: Caller, model: string): Promise<Result<null, AiFailure>> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: 'Antworte nur: OK' }]
  const result = await call({ model, max_tokens: TEST_MAX_TOKENS, messages })
  return result.ok ? ok(null) : err(result.error.failure)
}

export function createAnthropicAdapter(
  options: AnthropicAdapterOptions,
): VisionRecognizer & ConnectionTester {
  const call = createCaller(options)
  return {
    recognize: (request) => recognizeWith(call, request),
    testConnection: (model) => testWith(call, model),
  }
}
