// Welches Zod-Schema zu welcher Rolle gehört. Jeder Adapter schickt dieses Schema als Structured
// Output mit und prüft die Antwort mit parseAnswer. So gibt es eine einzige Quelle für beides.
import { z } from 'zod'
import type { AiRole } from '@/shared/config/ai-roles'
import {
  bestBeforeAnswerSchema,
  nutritionAnswerSchema,
  nutritionEstimateAnswerSchema,
  packagingAnswerSchema,
} from '@/features/capture/schemas'
import { err, ok, type Result } from '@/shared/lib/result'
import type { AiFailure, RecognitionRequest, RoleAnswers, RoleContexts } from './vision-recognizer'

type SchemaBuilders = {
  [R in AiRole]: (context: RoleContexts[R]) => z.ZodType<RoleAnswers[R]>
}

const SCHEMA_BUILDERS: SchemaBuilders = {
  verpackung: ({ foodTypes }) => packagingAnswerSchema(foodTypes.map((foodType) => foodType.key)),
  naehrwerte: () => nutritionAnswerSchema,
  naehrwerte_schaetzen: () => nutritionEstimateAnswerSchema,
  mhd: () => bestBeforeAnswerSchema,
  mhd_zweitversuch: () => bestBeforeAnswerSchema,
}

type SchemaInput<R extends AiRole> = Pick<RecognitionRequest<R>, 'role' | 'context'>

export function schemaForRole<R extends AiRole>({
  role,
  context,
}: SchemaInput<R>): z.ZodType<RoleAnswers[R]> {
  const build: SchemaBuilders[R] = SCHEMA_BUILDERS[role]
  return build(context)
}

/** Prüft eine Rohantwort gegen das Schema der Rolle. Ein Verstoß ist ein erwarteter Fehler. */
export function parseAnswer<R extends AiRole>(
  request: SchemaInput<R>,
  raw: unknown,
): Result<RoleAnswers[R], AiFailure> {
  const parsed = schemaForRole(request).safeParse(raw)
  if (parsed.success) return ok(parsed.data)
  return err({ kind: 'invalid-response', issues: z.prettifyError(parsed.error) })
}
