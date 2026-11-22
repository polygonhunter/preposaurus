// Eine Better-Auth-Instanz je Serverprozess, aus env.ts und getDb() gebaut.
// Wie getDb() auf globalThis, damit der Hot Reload keine zweite Instanz anlegt.
import 'server-only'
import { loadEnv } from '@/shared/config/env'
import { createLogger } from '@/shared/lib/logger'
import { getDb } from '../db/get-db'
import { createAuth, type Auth } from './auth'

const AUTH_KEY = Symbol.for('preposaurus.auth')

interface AuthHolder {
  [AUTH_KEY]?: Promise<Auth> | undefined
}

async function buildAuth(): Promise<Auth> {
  const env = loadEnv()
  const logger = createLogger({ level: env.LOG_LEVEL })
  return createAuth({
    db: await getDb(),
    secret: env.APP_SECRET,
    clientIpHeader: env.CLIENT_IP_HEADER,
    secureCookies: env.NODE_ENV === 'production',
    log: (level, message) => {
      logger[level](`Better Auth: ${message}`)
    },
  })
}

export async function getAuth(): Promise<Auth> {
  const holder = globalThis as AuthHolder
  holder[AUTH_KEY] ??= buildAuth().catch((error: unknown) => {
    holder[AUTH_KEY] = undefined
    throw error
  })
  return holder[AUTH_KEY]
}
