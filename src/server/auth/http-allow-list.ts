// Erlaubt-Liste für die HTTP-Routen von Better Auth (Sicherheits-Review #138). Zurzeit gibt es
// keine Route /api/auth/[...all]: Anmelden und Abmelden laufen als Server Actions über auth.api,
// das von dieser Liste nicht berührt wird. Kommt die Route doch, beantwortet auth.handler jeden
// Pfad mit 404, der hier nicht ausdrücklich steht. Eine Sperrliste würde neue Routen von Better
// Auth (z. B. /change-password, /list-sessions) still freigeben.
import 'server-only'
import type { BetterAuthPlugin } from 'better-auth'

export const ALLOWED_HTTP_PATHS: readonly string[] = []

const DEFAULT_BASE_PATH = '/api/auth'

function pathWithinBase(url: string, basePath: string): string {
  const pathname = new URL(url).pathname.replace(/\/+$/, '')
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname
}

const notFound = () => ({ response: new Response('Not Found', { status: 404 }) })

export function httpAllowList(allowed: readonly string[]): BetterAuthPlugin {
  return {
    id: 'http-allow-list',
    onRequest: (request, context) => {
      const path = pathWithinBase(request.url, context.options.basePath ?? DEFAULT_BASE_PATH)
      return Promise.resolve(allowed.includes(path) ? undefined : notFound())
    },
  }
}
