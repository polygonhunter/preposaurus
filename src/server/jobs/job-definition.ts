// Ein Job des Workers (UMSETZUNG M11-01): Name der Warteschlange, Zod-Schema der Payload, ein
// optionaler Zeitplan und die Arbeit selbst. Die Payload kommt aus der Datenbank und gilt als
// Eingabe von außen, deshalb prüft `execute` sie vor jedem Lauf (CODE_PRINZIPIEN §7).
import { z } from 'zod'
import type { Logger } from '@/shared/lib/logger'
import { err, ok, type Result } from '@/shared/lib/result'

interface JobContext {
  logger: Logger
}

/** Zeitplan in Europe/Berlin, z. B. `30 3 * * *` für täglich um 3:30 Uhr. */
interface JobSchedule<Payload extends object = object> {
  cron: string
  payload: Payload
}

/** Neue Versuche nach einem Fehler. Ab einer Pause über 0 wächst sie mit jedem Versuch. */
interface JobRetry {
  limit: number
  delaySeconds: number
}

// Drei neue Versuche, der erste nach 30 Sekunden.
const DEFAULT_RETRY: JobRetry = { limit: 3, delaySeconds: 30 }

type PayloadSchema = z.ZodType<object, object>

export interface JobDefinition<Schema extends PayloadSchema> {
  /** Name der Warteschlange in pg-boss, kebab-case */
  name: string
  schema: Schema
  schedule: JobSchedule<z.input<Schema>> | null
  retry?: JobRetry
  run: (payload: z.output<Schema>, context: JobContext) => Promise<void>
}

interface JobFailure {
  kind: 'invalid-payload'
  issues: string
}

/** Form für die Warteschlange: Der Typ der Payload steckt nach `defineJob` im Schema. */
export interface Job {
  name: string
  schedule: JobSchedule | null
  retry: JobRetry
  /** Prüft die Payload und führt den Job aus. Unerwartete Fehler werden geworfen. */
  execute: (payload: unknown, context: JobContext) => Promise<Result<null, JobFailure>>
}

export function defineJob<Schema extends PayloadSchema>(definition: JobDefinition<Schema>): Job {
  const { name, schema, schedule, retry = DEFAULT_RETRY, run } = definition
  return {
    name,
    schedule,
    retry,
    execute: async (payload, context) => {
      const parsed = schema.safeParse(payload)
      if (!parsed.success) {
        return err({ kind: 'invalid-payload', issues: z.prettifyError(parsed.error) })
      }
      await run(parsed.data, context)
      return ok(null)
    },
  }
}
