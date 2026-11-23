// Browser-Seite des Offline-Betriebs (M10-01/M10-02): Service Worker anmelden und die Seiten-Caches
// mit Haushaltsdaten löschen. Nur in Client-Komponenten aufrufen.
import { createLogger } from './logger'
import { isPageCache } from './offline-cache'

const SERVICE_WORKER_URL = '/sw.js'
// Im Browser gibt es keine Umgebung, nur Warnungen landen in der Konsole.
const logger = createLogger({ level: 'warn' })

function loadedUrls(): string[] {
  const resources = performance.getEntriesByType('resource').map((entry) => entry.name)
  return [window.location.href, ...resources]
}

// Beim ersten Besuch lädt die Seite, bevor der Service Worker läuft. Damit sie trotzdem ohne
// Verbindung geht, reicht sie ihre Adressen nach. Er nimmt nur, was seine Regeln erlauben.
async function register(): Promise<void> {
  const isFirstVisit = navigator.serviceWorker.controller === null
  await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/', updateViaCache: 'none' })
  if (!isFirstVisit) return
  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({ type: 'cache-urls', urls: loadedUrls() })
}

// Ohne Service Worker läuft die App genauso, nur nicht ohne Verbindung. Ein Fehler stört deshalb
// nicht, landet aber in der Konsole.
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    await register()
  } catch (error) {
    logger.warn('Service Worker nicht angemeldet', { error })
  }
}

// Anmelden und Einrichten: Der letzte Stand der vorigen Sitzung bleibt nicht im Browser.
export async function clearOfflinePages(): Promise<void> {
  if (!('caches' in window)) return
  try {
    const keys = await caches.keys()
    await Promise.all(keys.filter(isPageCache).map((key) => caches.delete(key)))
  } catch (error) {
    logger.warn('Offline-Stand nicht gelöscht', { error })
  }
}
