// Next ruft register() einmal beim Serverstart auf. Fehlt eine Variable, bricht der Start
// mit klarer Meldung ab, statt später bei der ersten Anfrage (CODE_PRINZIPIEN §7).
import { loadEnv } from './shared/config/env'
import { createLogger } from './shared/lib/logger'

export function register(): void {
  const env = loadEnv()
  createLogger({ level: env.LOG_LEVEL }).info('Umgebung geprüft, Server startet', {
    nodeEnv: env.NODE_ENV,
    aiProvider: env.AI_PROVIDER,
  })
}
