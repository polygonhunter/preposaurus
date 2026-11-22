// Zugriffsschutz, erste Stufe (#33): Ohne Sitzungs-Cookie geht jede Seite zur Anmeldung, mit der
// aufgerufenen Adresse als Rücksprung. Das ist nur eine schnelle, optimistische Prüfung ohne DB
// (Next-Doku „Optimistic checks with Proxy“). Ob die Sitzung gilt, prüfen das App-Layout und jede
// Seite, Action und Route selbst über die Guards in src/server/auth/guards.ts.
import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const SIGN_IN_PATH = '/anmelden'

export function proxy(request: NextRequest) {
  if (getSessionCookie(request) !== null) return NextResponse.next()
  const target = new URL(SIGN_IN_PATH, request.url)
  const { pathname, search } = request.nextUrl
  if (pathname !== '/') target.searchParams.set('weiter', `${pathname}${search}`)
  return NextResponse.redirect(target)
}

// Öffentlich bleiben Anmelden, Einrichten, /api (Routen prüfen selbst, /api/health ist bewusst
// offen), die Musterseite (nur Dev) sowie Next-Dateien und Dateien mit Endung wie favicon.ico.
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|anmelden|einrichten|muster|.*\\.[a-zA-Z0-9]+$).*)'],
}
