// Better Auth auf den deutschen Tabellen (EINSTELLUNGEN_NUTZER §4, ABGLEICH E-1, E-13).
// Anmeldung nur mit Benutzername und Passwort, keine freie Registrierung, kein Admin-Plugin.
// Nutzer, Passwörter und Sitzungen der Nutzerverwaltung setzen eigene Use-Cases über $context.
import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { username } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { usernameSchema } from '@/features/auth/schemas'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USER_ROLES } from '@/shared/config/constants'
import type { Database } from '../db/connection'
import { accounts, sessions, users, verifications } from '../db/schema/account'
import { isIgnoredAuthWarning } from './auth-log-filter'
import { ALLOWED_HTTP_PATHS, httpAllowList } from './http-allow-list'

const DAY_IN_SECONDS = 24 * 60 * 60
// 180 Tage, gleitend: Jede Nutzung nach mehr als einem Tag verlängert wieder (EINSTELLUNGEN §4.1).
const SESSION_DAYS = 180

// Anmeldung nur über das Username-Plugin. Registrieren gibt es nicht, Nutzer legt ein Admin an.
const EMAIL_AND_PASSWORD = {
  enabled: true,
  disableSignUp: true,
  minPasswordLength: PASSWORD_MIN_LENGTH,
  maxPasswordLength: PASSWORD_MAX_LENGTH,
}

const SESSION = {
  expiresIn: SESSION_DAYS * DAY_IN_SECONDS,
  updateAge: DAY_IN_SECONDS,
  // Kein Zwischenspeicher im Cookie: Deaktivieren und Zurücksetzen wirken sofort.
  cookieCache: { enabled: false },
}

type AuthLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type AuthOptions = Readonly<{
  db: Database
  secret: string
  clientIpHeader: string
  secureCookies: boolean
  // Meldungen von Better Auth laufen über unseren Logger statt direkt auf die Konsole.
  log: (level: AuthLogLevel, message: string) => void
  // Nur für Tests der Erlaubt-Liste, die App nutzt ALLOWED_HTTP_PATHS.
  allowedHttpPaths?: readonly string[]
}>

async function isUserActive(db: Database, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
  return row?.isActive === true
}

// Zweite Sperre neben der Prüfung beim Lesen der Sitzung: Ein deaktivierter Nutzer bekommt keine.
function sessionHooks(db: Database) {
  return {
    create: {
      before: async (session: { userId: string }) =>
        (await isUserActive(db, session.userId)) || false,
      after: async (session: { userId: string }) => {
        await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, session.userId))
      },
    },
  }
}

// Weitere Argumente können Nutzerdaten enthalten und bleiben deshalb draußen. Bekannte, im Betrieb
// bedeutungslose Warnungen fallen weg (Begründung in auth-log-filter.ts).
function authLogger(log: AuthOptions['log']) {
  return {
    log: (level: AuthLogLevel, message: string) => {
      if (level === 'warn' && isIgnoredAuthWarning(message)) return
      log(level, message)
    },
  }
}

export function createAuth(options: AuthOptions) {
  const { db, secret, clientIpHeader, secureCookies, log } = options
  return betterAuth({
    secret,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: EMAIL_AND_PASSWORD,
    user: {
      // Eigene Spalten von nutzer (Schlüssel = Drizzle-Eigenschaft). input: false, damit kein
      // Aufruf von außen Rolle, Status oder Haushalt setzt.
      additionalFields: {
        role: { type: [...USER_ROLES], required: true, defaultValue: 'mitglied', input: false },
        isActive: { type: 'boolean', required: true, defaultValue: true, input: false },
        householdId: { type: 'string', required: false, input: false },
      },
    },
    session: SESSION,
    databaseHooks: { session: sessionHooks(db) },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
      ipAddress: { ipAddressHeaders: [clientIpHeader] },
      useSecureCookies: secureCookies,
    },
    logger: authLogger(log),
    telemetry: { enabled: false },
    plugins: [
      // Über HTTP nur ausdrücklich erlaubte Pfade, auth.api bleibt davon unberührt.
      httpAllowList(options.allowedHttpPaths ?? ALLOWED_HTTP_PATHS),
      username({
        displayUsername: false,
        validationOrder: { username: 'post-normalization' },
        usernameValidator: (name) => usernameSchema.safeParse(name).success,
      }),
      // Muss das letzte Plugin sein: setzt Cookies auch aus Server Actions.
      nextCookies(),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
