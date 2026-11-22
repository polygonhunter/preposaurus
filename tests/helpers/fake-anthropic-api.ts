// HTTP-Ebene der Anthropic-API als Fake für die Adapter-Tests. Wird dem SDK als `fetch`
// übergeben, so läuft der echte SDK-Code (Fehlerklassen, Zeitlimit, Header) ohne Netz und ohne
// Schlüssel. Jede Anfrage wird mitgeschrieben, damit Tests den Request-Body prüfen können.

interface RecordedRequest {
  url: string
  headers: Headers
  body: Record<string, unknown>
}

type FakeReply = (signal: AbortSignal | null | undefined) => Promise<Response>

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'request-id': 'req_test', ...headers },
  })

export const messageReply =
  (answer: unknown, overrides: Record<string, unknown> = {}): FakeReply =>
  () =>
    Promise.resolve(
      json(200, {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-5-5',
        content: [
          { type: 'text', text: typeof answer === 'string' ? answer : JSON.stringify(answer) },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 80 },
        ...overrides,
      }),
    )

export const errorReply =
  (status: number, type: string, headers: Record<string, string> = {}): FakeReply =>
  () =>
    Promise.resolve(
      json(
        status,
        { type: 'error', error: { type, message: 'Testfehler' }, request_id: 'req_test' },
        headers,
      ),
    )

/** Antwortet nie. Erst das Zeitlimit des SDK bricht die Anfrage über das AbortSignal ab. */
export const hangingReply: FakeReply = (signal) =>
  new Promise((_resolve, reject) => {
    signal?.addEventListener('abort', () => {
      reject(new DOMException('Abgebrochen', 'AbortError'))
    })
  })

export function createFakeAnthropicApi(replies: readonly FakeReply[]) {
  const requests: RecordedRequest[] = []
  let next = 0
  const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {}
    const url = input instanceof Request ? input.url : input.toString()
    requests.push({ url, headers: new Headers(init?.headers), body })
    const reply = replies[next] ?? replies.at(-1)
    next += 1
    if (reply === undefined) throw new Error('Keine Antwort für den Fake hinterlegt')
    return reply(init?.signal)
  }
  const fetchForSdk: typeof fetch = fakeFetch
  return { fetch: fetchForSdk, requests }
}
