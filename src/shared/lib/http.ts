// Kleine Helfer für Route Handler: einheitliche Fehlerantworten und Schutz vor fremden Seiten.
import { readLimitedBody } from './read-limited-body'

const NO_STORE = { 'cache-control': 'no-store' }

/** JSON-Antwort, die kein Cache aufhebt (Antworten mit Nutzerdaten oder Fehlern). */
export function noStoreJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE })
}

/** Fehler mit ruhigem deutschem Satz für die Oberfläche, optional mit maschinenlesbarem Grund. */
export function errorResponse(status: number, message: string, reason?: string): Response {
  return noStoreJson(
    reason === undefined ? { fehler: message } : { fehler: message, grund: reason },
    status,
  )
}

/** Kleiner JSON-Body, höchstens `maxBytes`. Zu groß oder kein JSON ergibt undefined. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const body = await readLimitedBody(request.body, maxBytes)
  if (body === null) return undefined
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown
  } catch {
    // Kaputtes JSON ist eine erwartete Fehleingabe, die Prüfung danach lehnt undefined ab.
    return undefined
  }
}

/**
 * Browser schicken `Sec-Fetch-Site` mit. Eine Anfrage einer fremden Seite wird abgelehnt, auch
 * wenn das Sitzungs-Cookie (SameSite=Lax) sie schon ohne Anmeldung ankommen ließe.
 */
export function isCrossSiteRequest(request: Request): boolean {
  return request.headers.get('sec-fetch-site') === 'cross-site'
}
