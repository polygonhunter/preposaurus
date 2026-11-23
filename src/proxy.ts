// Läuft vor jeder Seite und hat zwei Aufgaben:
// 1. CSP mit frischer Nonce (#198). Next liest die Nonce aus dem CSP-Header der Anfrage und hängt
//    sie an seine eigenen Skripte und Styles (Next-Doku „Content Security Policy“). Dafür muss jede
//    Seite dynamisch rendern, das erzwingt das Root-Layout mit `connection()`.
// 2. Zugriffsschutz, erste Stufe (#33): Ohne Sitzungs-Cookie geht jede Seite zur Anmeldung, mit der
//    aufgerufenen Adresse als Rücksprung. Das ist nur eine schnelle, optimistische Prüfung ohne DB
//    (Next-Doku „Optimistic checks with Proxy“). Ob die Sitzung gilt, prüfen das App-Layout und
//    jede Seite, Action und Route selbst über die Guards in src/server/auth/guards.ts.
import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'
import { isDevelopmentServer } from '@/shared/config/env'
import { buildContentSecurityPolicy } from '@/shared/lib/security-headers'

const SIGN_IN_PATH = '/anmelden'
// Ohne Anmeldung erreichbar: Anmelden, Einrichten und die Musterseite (nur Dev bzw. E2E).
const PUBLIC_PAGE = /^\/(anmelden|einrichten|muster)(\/|$)/
const NONCE_BYTES = 16

function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(NONCE_BYTES))))
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const target = new URL(SIGN_IN_PATH, request.url)
  const { pathname, search } = request.nextUrl
  if (pathname !== '/') target.searchParams.set('weiter', `${pathname}${search}`)
  return NextResponse.redirect(target)
}

function withContentSecurityPolicy(request: NextRequest): NextResponse {
  const policy = buildContentSecurityPolicy({
    nonce: createNonce(),
    isDevelopment: isDevelopmentServer(),
  })
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('content-security-policy', policy)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', policy)
  return response
}

export function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PAGE.test(request.nextUrl.pathname)
  if (!isPublic && getSessionCookie(request) === null) return redirectToSignIn(request)
  return withContentSecurityPolicy(request)
}

// Ausgenommen sind /api (Routen prüfen selbst und setzen eigene Header, /api/health ist bewusst
// offen) sowie Next-Dateien und Dateien mit Endung wie /sw.js, Manifest und Icons.
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
}
