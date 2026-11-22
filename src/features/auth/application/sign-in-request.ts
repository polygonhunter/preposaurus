// Verdrahtet signIn mit DB, Better Auth, Logger und dem IP-Header aus env.ts.
import 'server-only'
import { getAuth } from '@/server/auth/get-auth'
import { readClientIp } from '@/server/auth/client-ip'
import { getDb } from '@/server/db/get-db'
import { loadEnv } from '@/shared/config/env'
import { createLogger } from '@/shared/lib/logger'
import type { Result } from '@/shared/lib/result'
import { createSignInLockRepository } from '../data/sign-in-lock-repository'
import type { SignInInput } from '../schemas'
import { signIn, type SignInError } from './sign-in'

export async function signInFromRequest(
  input: SignInInput,
  headers: Headers,
): Promise<Result<{ userId: string }, SignInError>> {
  const env = loadEnv()
  const logger = createLogger({ level: env.LOG_LEVEL })
  return signIn(
    {
      auth: await getAuth(),
      locks: createSignInLockRepository(await getDb()),
      headers,
      clientIp: readClientIp(headers, env.CLIENT_IP_HEADER),
      now: () => new Date(),
      logWarning: logger.warn,
    },
    input,
  )
}
