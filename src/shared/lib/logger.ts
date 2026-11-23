// Einziger Weg für Logausgaben (sonst kein console.*). Schlüssel, Passwörter und Tokens werden geschwärzt.
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

type LogContext = Readonly<Record<string, unknown>>
type LogMethod = (message: string, context?: LogContext) => void
export type Logger = Readonly<Record<LogLevel, LogMethod>>

type LogSink = (line: string) => void

type LoggerOptions = Readonly<{ level: LogLevel; sink?: LogSink }>

const SENSITIVE_KEY = /key|secret|token|password|passwort|authorization|cookie/i
const MAX_DEPTH = 5
const REDACTED = '[geschwärzt]'

// name, message und stack sind bei Error nicht aufzählbar und gingen in JSON.stringify verloren.
function serializeError(error: Error, depth: number): Record<string, unknown> {
  const base = { name: error.name, message: error.message, stack: error.stack }
  return error.cause === undefined ? base : { ...base, cause: redact(error.cause, depth + 1) }
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[zu tief]'
  if (value instanceof Error) return serializeError(value, depth)
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : redact(entry, depth + 1),
    ]),
  )
}

const writeToConsole: LogSink = (line) => {
  // eslint-disable-next-line no-console -- der Logger ist die eine erlaubte Ausgabestelle, console läuft auch im Edge-Runtime
  console.log(line)
}

export function createLogger({ level, sink = writeToConsole }: LoggerOptions): Logger {
  const threshold = LOG_LEVELS.indexOf(level)
  const method =
    (methodLevel: LogLevel): LogMethod =>
    (message, context) => {
      if (LOG_LEVELS.indexOf(methodLevel) < threshold) return
      const entry = { time: new Date().toISOString(), level: methodLevel, message }
      sink(JSON.stringify(context ? { ...entry, context: redact(context) } : entry))
    }
  return {
    debug: method('debug'),
    info: method('info'),
    warn: method('warn'),
    error: method('error'),
  }
}
