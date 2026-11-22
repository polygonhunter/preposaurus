// JSON-Schema für Structured Outputs aus dem Zod-Schema der Rolle. z.toJSONSchema schreibt oben
// `$schema` hinein. Die Doku zu Structured Outputs nennt das Schlüsselwort weder als erlaubt noch
// als verboten, deshalb fällt es weg, bevor das Schema zum Anbieter geht (Review zu #130).
import { z } from 'zod'
import type { AiRole } from '@/shared/config/ai-roles'
import { schemaForRole } from './role-schemas'
import type { RecognitionRequest } from './vision-recognizer'

export type OutputJsonSchema = Record<string, unknown>

export function outputJsonSchema<R extends AiRole>(
  request: Pick<RecognitionRequest<R>, 'role' | 'context'>,
): OutputJsonSchema {
  const schema = z.toJSONSchema(schemaForRole(request))
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== '$schema'))
}
