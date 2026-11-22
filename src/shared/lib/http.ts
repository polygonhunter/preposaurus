// Kleine Helfer für Route Handler: einheitliche Fehlerantworten und Schutz vor fremden Seiten.

const NO_STORE = { 'cache-control': 'no-store' }

/** JSON-Antwort, die kein Cache aufhebt (Antworten mit Nutzerdaten oder Fehlern). */
export function noStoreJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE })
}

/** Fehler mit ruhigem deutschem Satz für die Oberfläche. */
export function errorResponse(status: number, message: string): Response {
  return noStoreJson({ fehler: message }, status)
}

/**
 * Browser schicken `Sec-Fetch-Site` mit. Eine Anfrage einer fremden Seite wird abgelehnt, auch
 * wenn das Sitzungs-Cookie (SameSite=Lax) sie schon ohne Anmeldung ankommen ließe.
 */
export function isCrossSiteRequest(request: Request): boolean {
  return request.headers.get('sec-fetch-site') === 'cross-site'
}
