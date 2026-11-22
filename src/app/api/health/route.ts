// Lebenszeichen für den Docker-Healthcheck und die Einrichtung (UMSETZUNG M13-01). Die Route ist
// ohne Anmeldung erreichbar und verrät deshalb nur den Status: keine Version, keine Umgebung, keine Daten.
export function GET(): Response {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } })
}
