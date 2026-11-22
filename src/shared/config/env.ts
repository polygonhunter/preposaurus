// Einzige Stelle, die process.env liest (CODE_PRINZIPIEN §2). Jede Variable steht auch in .env.example.
import { z } from 'zod'
import { LOG_LEVELS } from '../lib/logger'
import { err, ok, type Result } from '../lib/result'

const DATABASE_URL_PATTERN = /^(postgres|postgresql|pglite):\/\//
const APP_SECRET_MIN_LENGTH = 32

const required = (name: string) =>
  z
    .string({ error: `${name} fehlt. Eine Vorlage steht in .env.example.` })
    .min(1, `${name} ist leer.`)

// Eine leere Zeile aus .env.example („KEY=“) gilt als nicht gesetzt.
const optionalSecret = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value : undefined))

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  DATABASE_URL: required('DATABASE_URL').regex(
    DATABASE_URL_PATTERN,
    'DATABASE_URL muss mit postgres://, postgresql:// oder pglite:// beginnen.',
  ),
  // Signiert die Sitzungs-Cookies (Better Auth). Ändert er sich, sind alle abgemeldet.
  APP_SECRET: required('APP_SECRET').min(
    APP_SECRET_MIN_LENGTH,
    `APP_SECRET braucht mindestens ${String(APP_SECRET_MIN_LENGTH)} Zeichen, z. B. aus: openssl rand -base64 32`,
  ),
  // Header mit der Adresse des Geräts. Tailscale Serve setzt x-forwarded-for (EINSTELLUNGEN §4.3).
  CLIENT_IP_HEADER: z.string().trim().toLowerCase().min(1).default('x-forwarded-for'),
  // fake: feste Antworten ohne Netz (Entwicklung, Tests). anthropic: echte Verbindungen.
  AI_PROVIDER: z.enum(['anthropic', 'fake']).default('fake'),
  // Feste Verbindung „aus Umgebungsvariable“ mit Vorrang vor den Verbindungen in der App (#108).
  // Modelle je Rolle kommen nicht aus der Umgebung, sondern aus der Zuweisung in der App bzw.
  // der Empfehlung in ai-roles.ts (Entscheidung #59).
  ANTHROPIC_API_KEY: optionalSecret,
  PHOTO_STORAGE_DIR: z.string().min(1).default('./.data/fotos'),
})

export type Env = z.infer<typeof envSchema>

type EnvSource = Readonly<Record<string, string | undefined>>

function parseEnv(source: EnvSource): Result<Env, string> {
  const parsed = envSchema.safeParse(source)
  if (parsed.success) return ok(parsed.data)
  return err(`Ungültige Umgebungsvariablen:\n${z.prettifyError(parsed.error)}`)
}

// Wirft bei ungültigen Werten: ohne gültige Umgebung soll der Server gar nicht erst starten.
export function loadEnv(source: EnvSource = process.env): Env {
  const result = parseEnv(source)
  if (!result.ok) throw new Error(result.error)
  return result.value
}
