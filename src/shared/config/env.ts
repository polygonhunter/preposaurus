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
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value : undefined))

const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value)

const DEFAULT_SMTP_PORT = 587

// Mail ist optional (#87): Ohne SMTP_HOST sind Mails aus. Mit SMTP_HOST braucht es einen Absender,
// und Nutzer und Passwort kommen nur zusammen.
const smtpSchema = z.object({
  SMTP_HOST: optionalText,
  SMTP_PORT: z.preprocess(
    emptyAsUnset,
    z.coerce.number().int().min(1).max(65_535).default(DEFAULT_SMTP_PORT),
  ),
  // Leer: TLS von Anfang an nur auf Port 465, sonst STARTTLS
  SMTP_SECURE: z.preprocess(
    emptyAsUnset,
    z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  ),
  SMTP_USER: optionalText,
  SMTP_PASSWORD: optionalText,
  SMTP_FROM: optionalText,
})

type SmtpValues = z.infer<typeof smtpSchema>

function checkSmtp(values: SmtpValues, context: z.RefinementCtx): void {
  if (values.SMTP_HOST !== undefined && values.SMTP_FROM === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_FROM'],
      message: 'SMTP_FROM fehlt (Absender der Mails).',
    })
  }
  if ((values.SMTP_USER === undefined) !== (values.SMTP_PASSWORD === undefined)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_PASSWORD'],
      message: 'SMTP_USER und SMTP_PASSWORD gehören zusammen: beide setzen oder beide leer lassen.',
    })
  }
}

const baseSchema = z.object({
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
  ANTHROPIC_API_KEY: optionalText,
  PHOTO_STORAGE_DIR: z.string().min(1).default('./.data/fotos'),
  // Ordner mit den Status-Dateien des Backup-Dienstes (#147), im Container nur lesend eingebunden.
  // Leer: Die App zeigt keine letzte Sicherung an (z. B. in der Entwicklung).
  BACKUP_STATUS_DIR: optionalText,
  // Adresse der App für Links in Mails, z. B. https://haushalt.beispiel.ts.net (M11-05). Ohne sie
  // haben Mails keinen Link. Die App selbst braucht sie nicht, sie kennt ihre Adresse aus der Anfrage.
  APP_URL: optionalText.pipe(
    z
      .url({ protocol: /^https?$/, error: 'APP_URL muss mit https:// oder http:// beginnen.' })
      .optional(),
  ),
  // Musterseite /muster auch im Produktionsbuild zeigen (nur für die E2E-Tests in der CI).
  SHOW_PATTERN_PAGE: z.stringbool().default(false),
  // Sitzungs-Cookie im Produktionsbuild ohne Secure (nur für die E2E-Tests der CI über
  // http://localhost: WebKit speichert dort keine Secure-Cookies). Im Betrieb nie setzen.
  E2E_INSECURE_COOKIES: z.stringbool().default(false),
  // Nur E2E: POST /api/e2e/beispielvorrat legt den Beispielvorrat in den Haushalt des angemeldeten
  // Admins (tests/e2e/beispielvorrat.setup.ts). Im Betrieb nie setzen.
  E2E_DEMO_STOCK: z.stringbool().default(false),
  // Setzt GitHub Actions (CI=true). Bindet E2E_INSECURE_COOKIES und E2E_DEMO_STOCK an die CI.
  CI: optionalText.transform((value) => value !== undefined && !/^(0|false)$/i.test(value.trim())),
})

type BaseValues = z.infer<typeof baseSchema>

// Ein versehentlich gesetztes E2E_INSECURE_COOKIES im Betrieb stoppt den Start, statt die
// Sitzungs-Cookies still ohne Secure auszuliefern.
// Dasselbe gilt für E2E_DEMO_STOCK: Im Betrieb legt niemand per Aufruf Beispieldaten an.
function checkE2eFlags(values: BaseValues, context: z.RefinementCtx): void {
  const isOperation = values.NODE_ENV === 'production' && !values.CI
  for (const key of ['E2E_INSECURE_COOKIES', 'E2E_DEMO_STOCK'] as const) {
    if (values[key] && isOperation) {
      context.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} gilt nur für die E2E-Tests der CI. Im Betrieb bitte entfernen.`,
      })
    }
  }
}

const envSchema = baseSchema
  .extend(smtpSchema.shape)
  .superRefine(checkSmtp)
  .superRefine(checkE2eFlags)

export type Env = z.infer<typeof envSchema>

type EnvSource = Readonly<Record<string, string | undefined>>

function parseEnv(source: EnvSource): Result<Env, string> {
  const parsed = envSchema.safeParse(source)
  if (parsed.success) return ok(parsed.data)
  return err(`Ungültige Umgebungsvariablen:\n${z.prettifyError(parsed.error)}`)
}

// Im Dev-Modus immer, sonst nur mit SHOW_PATTERN_PAGE=true.
export function isPatternPageEnabled(env: Pick<Env, 'NODE_ENV' | 'SHOW_PATTERN_PAGE'>): boolean {
  return env.NODE_ENV !== 'production' || env.SHOW_PATTERN_PAGE
}

// Secure-Cookies im Produktionsbuild, außer im E2E-Lauf der CI (E2E_INSECURE_COOKIES und CI).
export function isCookieSecure(
  env: Pick<Env, 'NODE_ENV' | 'E2E_INSECURE_COOKIES' | 'CI'>,
): boolean {
  return env.NODE_ENV === 'production' && !(env.E2E_INSECURE_COOKIES && env.CI)
}

// Service Worker nur im Produktionsbuild (UMSETZUNG M10-01): Im Dev-Modus hielte sein Cache alte
// Dateien fest. Liest nur NODE_ENV, damit auch statisch gerenderte Seiten ohne volle Umgebung bauen.
export function isServiceWorkerEnabled(source: EnvSource = process.env): boolean {
  return source['NODE_ENV'] === 'production'
}

// Wirft bei ungültigen Werten: ohne gültige Umgebung soll der Server gar nicht erst starten.
export function loadEnv(source: EnvSource = process.env): Env {
  const result = parseEnv(source)
  if (!result.ok) throw new Error(result.error)
  return result.value
}
