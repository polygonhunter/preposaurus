// Eingaben der Seite „Foto-Erkennung“ (#108). Fehlertexte nennen nie den eingegebenen Schlüssel.
import { z } from 'zod'
import { AI_ROLES } from '@/shared/config/ai-roles'

const CONNECTION_NAME_MAX_LENGTH = 40
// Anthropic-Schlüssel beginnen mit sk-ant- und sind rund 100 Zeichen lang. Die Mindestlänge
// verhindert, dass der Hinweis aus den letzten vier Zeichen fast den ganzen Schlüssel zeigt (#108).
const API_KEY_MIN_LENGTH = 40
const API_KEY_MAX_LENGTH = 400
const ANTHROPIC_KEY_PATTERN = /^sk-ant-[A-Za-z0-9_-]+$/
// Modell-IDs der Anbieter, z. B. claude-haiku-5-5. Freier Text, weil neue Modelle ohne Update
// wählbar bleiben sollen, aber ohne Leerzeichen und Sonderzeichen.
const MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]{2,79}$/

const KEY_FORMAT_ERROR =
  'Das sieht nicht wie ein Anthropic-Schlüssel aus. Er beginnt mit „sk-ant-“.'

export const apiKeySchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte den Schlüssel einfügen.' })
  .max(API_KEY_MAX_LENGTH, { error: KEY_FORMAT_ERROR })
  .regex(ANTHROPIC_KEY_PATTERN, { error: KEY_FORMAT_ERROR })
  .min(API_KEY_MIN_LENGTH, { error: 'Der Schlüssel ist zu kurz. Bitte ganz einfügen.' })

const connectionNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte einen Namen eintragen.' })
  .max(CONNECTION_NAME_MAX_LENGTH, { error: 'Bitte höchstens 40 Zeichen.' })

export const newConnectionSchema = z.object({ name: connectionNameSchema, apiKey: apiKeySchema })

export const connectionIdSchema = z.uuid()

/** „env“ steht für die feste Verbindung aus der Umgebung */
export const testTargetSchema = z.union([z.literal('env'), connectionIdSchema])

const roleChoiceSchema = z.object({
  role: z.enum(AI_ROLES),
  model: z.string().trim().regex(MODEL_PATTERN, { error: 'Bitte ein Modell wählen.' }),
  connectionId: connectionIdSchema.nullable(),
  isActive: z.boolean(),
})

export const roleChoicesSchema = z.array(roleChoiceSchema).min(1).max(AI_ROLES.length)
