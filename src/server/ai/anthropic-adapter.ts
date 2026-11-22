// Anthropic-Adapter (M6-05, #59): einzige Datei, die das SDK kennt. Je Foto-Rolle ein Aufruf mit
// Structured Outputs (output_config.format, Schema aus capture/schemas.ts), Foto als Base64 vor dem
// Text. Zeitlimit je Versuch, höchstens eine Wiederholung bei 429 und 5xx (die eingebaute
// Wiederholung des SDK ist aus, weil sie auch Zeitüberschreitungen wiederholt), begrenzte
// Gleichzeitigkeit. Fehler werden auf AiFailure abgebildet. Der Schlüssel steht nie in einer
// Rückgabe oder einem Fehler. Geprüft gegen die Doku vom 2026-11-22 (SDK 1.12.0).
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { AiRole } from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import type { SecretValue } from '../crypto/secret-value'
import type { ConcurrencyLimit } from './concurrency-limit'
import { outputJsonSchema } from './output-schema'
import { promptForRole } from './prompts'
import { retryOnce, sleep as waitFor } from './retry-once'
import { parseAnswer } from './role-schemas'
import type {
  AiFailure,
  ConnectionTester,
  RecognitionOutcome,
  RecognitionRequest,
  VisionRecognizer,
} from './vision-recognizer'

const DEFAULT_TIMEOUT_MS = 30_000
// Reicht für die schlanken Schemas samt adaptivem Denken der Modelle (Standard bei Haiku/Sonnet 5.5).
const MAX_OUTPUT_TOKENS = 8_000
const TEST_MAX_TOKENS = 16
const DEFAULT_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 5_000
const MS_PER_SECOND = 1_000

export interface AnthropicAdapterOptions {
  apiKey: SecretValue
  /** Anderer Endpunkt (basis_url der Verbindung), sonst der Standard des SDK */
  baseUrl: string | null
  limit: ConcurrencyLimit
  timeoutMs?: number
  /** Nur für Tests: HTTP-Ebene ersetzen bzw. Wartezeit überspringen */
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

interface CallError {
  failure: AiFailure
  /** null: nicht wiederholen */
  retryDelayMs: number | null
}

function retryDelayFrom(headers: Headers | undefined): number {
  const seconds = Number(headers?.get('retry-after'))
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_RETRY_DELAY_MS
  return Math.min(seconds * MS_PER_SECOND, MAX_RETRY_DELAY_MS)
}

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

function classify(error: unknown): CallError {
  // Kein Fehler des Anbieters, sondern ein Programmfehler: weiterwerfen (CODE_PRINZIPIEN §6).
  if (!(error instanceof Anthropic.APIError)) throw error
  const isRetryable =
    error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError
  return {
    failure: failureFor(error),
    retryDelayMs: isRetryable ? retryDelayFrom(error.headers) : null,
  }
}

type CreateParams = Anthropic.MessageCreateParamsNonStreaming

function requestParams<R extends AiRole>(request: RecognitionRequest<R>): CreateParams {
  const prompt = promptForRole(request)
  const image: Anthropic.ImageBlockParam = {
    type: 'image',
    source: {
      type: 'base64',
      media_type: request.image.mimeType,
      data: Buffer.from(request.image.data).toString('base64'),
    },
  }
  return {
    model: request.model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: prompt.system,
    messages: [{ role: 'user', content: [image, { type: 'text', text: prompt.instruction }] }],
    output_config: { format: { type: 'json_schema', schema: outputJsonSchema(request) } },
  }
}

function invalid(issues: string): Result<never, AiFailure> {
  return err({ kind: 'invalid-response', issues })
}

function readAnswer<R extends AiRole>(message: Anthropic.Message, request: RecognitionRequest<R>) {
  // Laut Doku passt die Antwort bei refusal und max_tokens nicht sicher zum Schema.
  if (message.stop_reason === 'refusal') return invalid('Anfrage vom Anbieter abgelehnt (refusal)')
  if (message.stop_reason === 'max_tokens') return invalid('Antwort abgeschnitten (max_tokens)')
  const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
  try {
    return parseAnswer(request, JSON.parse(text) as unknown)
  } catch {
    return invalid('Antwort ist kein gültiges JSON')
  }
}

type Caller = (params: CreateParams) => Promise<Result<Anthropic.Message, CallError>>

function createCaller(options: AnthropicAdapterOptions): Caller {
  const client = new Anthropic({
    apiKey: options.apiKey.reveal(),
    baseURL: options.baseUrl,
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: 0,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  })
  const attempt = async (params: CreateParams): Promise<Result<Anthropic.Message, CallError>> => {
    try {
      return ok(await client.messages.create(params))
    } catch (error) {
      return err(classify(error))
    }
  }
  const policy = {
    retryDelayMs: (error: CallError) => error.retryDelayMs,
    sleep: options.sleep ?? waitFor,
  }
  return (params: CreateParams) => retryOnce(() => attempt(params), policy)
}

/** Dauer samt einer etwaigen Wiederholung. Tokens nur aus der erfolgreichen Antwort. */
async function recognizeWith<R extends AiRole>(
  call: Caller,
  request: RecognitionRequest<R>,
): Promise<RecognitionOutcome<R>> {
  const startedAt = performance.now()
  const result = await call(requestParams(request))
  const base = { role: request.role, model: request.model }
  const durationMs = Math.round(performance.now() - startedAt)
  if (!result.ok) {
    const record = { ...base, durationMs, inputTokens: null, outputTokens: null }
    return { call: record, answer: err(result.error.failure) }
  }
  const { input_tokens: inputTokens, output_tokens: outputTokens } = result.value.usage
  return {
    call: { ...base, durationMs, inputTokens, outputTokens },
    answer: readAnswer(result.value, request),
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
    recognize: (request) => options.limit(() => recognizeWith(call, request)),
    testConnection: (model) => options.limit(() => testWith(call, model)),
  }
}
