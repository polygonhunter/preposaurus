// Logger für Tests: sammelt die Einträge statt sie auszugeben.
import { createLogger, type Logger } from '../../src/shared/lib/logger'

interface LogEntry {
  level: string
  message: string
  context?: Record<string, unknown>
}

export interface MemoryLogger {
  logger: Logger
  entries: LogEntry[]
  messages: () => string[]
}

export function createMemoryLogger(): MemoryLogger {
  const entries: LogEntry[] = []
  const logger = createLogger({
    level: 'debug',
    sink: (line) => entries.push(JSON.parse(line) as LogEntry),
  })
  return { logger, entries, messages: () => entries.map((entry) => entry.message) }
}
