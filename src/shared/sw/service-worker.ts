// Service Worker der App (M10-01/M10-02, #81/#82). scripts/build-sw.ts bündelt ihn vor jedem
// Build nach public/sw.js. Was gespeichert wird, entscheiden die Regeln in offline-cache.ts.
// Eigener schlanker Service Worker statt Serwist: Begründung in 05_STATUS_ENTSCHEIDUNGEN.md.
import {
  cacheNamesFor,
  endsSession,
  isPageCache,
  outdatedCaches,
  shouldStorePage,
  strategyFor,
  warmStrategyFor,
} from '../lib/offline-cache'
import { offlineFallbackResponse } from './offline-fallback'

// Setzt esbuild beim Bündeln (Zeitpunkt des Builds). Jeder Build ergibt einen neuen Service Worker,
// der beim Aktivieren die Caches der alten Version löscht.
declare const SW_VERSION: string

// Die DOM-Typen kennen keinen Service Worker, die WebWorker-Typen vertragen sich nicht mit DOM.
// Darum nur das Nötige von Hand.
interface WaitableEvent extends Event {
  waitUntil: (promise: Promise<unknown>) => void
}
interface SwFetchEvent extends WaitableEvent {
  readonly request: Request
  respondWith: (response: Promise<Response>) => void
}
interface SwMessageEvent extends WaitableEvent {
  readonly data: unknown
}
interface SwScope {
  readonly location: Location
  readonly clients: { claim: () => Promise<void> }
  skipWaiting: () => Promise<void>
  addEventListener: ((
    type: 'install' | 'activate',
    listener: (event: WaitableEvent) => void,
  ) => void) &
    ((type: 'fetch', listener: (event: SwFetchEvent) => void) => void) &
    ((type: 'message', listener: (event: SwMessageEvent) => void) => void)
}

const scope = globalThis as unknown as SwScope
const names = cacheNamesFor(SW_VERSION)
const origin = scope.location.origin
const MAX_WARM_URLS = 100

async function clearPages(): Promise<void> {
  const keys = await caches.keys()
  await Promise.all(keys.filter(isPageCache).map((key) => caches.delete(key)))
}

async function removeOutdated(): Promise<void> {
  const keys = await caches.keys()
  await Promise.all(outdatedCaches(keys, names).map((key) => caches.delete(key)))
}

async function rememberPage(request: Request, response: Response): Promise<void> {
  const finalUrl = new URL(response.url || request.url)
  if (endsSession(finalUrl)) {
    await clearPages()
    return
  }
  const facts = {
    ok: response.ok,
    redirected: response.redirected,
    contentType: response.headers.get('content-type'),
    finalUrl,
  }
  if (!shouldStorePage(facts)) return
  const cache = await caches.open(names.pages)
  await cache.put(request.url, response)
}

async function networkFirstPage(event: SwFetchEvent): Promise<Response> {
  try {
    const response = await fetch(event.request)
    event.waitUntil(rememberPage(event.request, response.clone()))
    return response
  } catch {
    const cached = await caches.match(event.request.url, {
      cacheName: names.pages,
      ignoreVary: true,
    })
    return cached ?? offlineFallbackResponse()
  }
}

async function cacheFirstFile(event: SwFetchEvent): Promise<Response> {
  const cache = await caches.open(names.files)
  const cached = await cache.match(event.request)
  if (cached) return cached
  const response = await fetch(event.request)
  if (response.ok) event.waitUntil(cache.put(event.request, response.clone()))
  return response
}

async function warmFile(url: URL): Promise<void> {
  const cache = await caches.open(names.files)
  if (await cache.match(url)) return
  const response = await fetch(url)
  if (response.ok) await cache.put(url, response)
}

async function warmPage(url: URL): Promise<void> {
  const request = new Request(url, { credentials: 'same-origin' })
  await rememberPage(request, await fetch(request))
}

// Beim ersten Besuch lief alles am Service Worker vorbei. Die Seite reicht ihre Adressen nach.
async function warm(urls: readonly string[]): Promise<void> {
  const jobs = urls.slice(0, MAX_WARM_URLS).map((text) => {
    const url = new URL(text, origin)
    const strategy = warmStrategyFor(url, origin)
    if (strategy === 'files') return warmFile(url)
    if (strategy === 'pages') return warmPage(url)
    return Promise.resolve()
  })
  await Promise.allSettled(jobs)
}

function readWarmUrls(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return []
  const { type, urls } = data as { type?: unknown; urls?: unknown }
  if (type !== 'cache-urls' || !Array.isArray(urls)) return []
  return urls.filter((url): url is string => typeof url === 'string')
}

scope.addEventListener('install', (event) => {
  event.waitUntil(scope.skipWaiting())
})

scope.addEventListener('activate', (event) => {
  event.waitUntil(removeOutdated().then(() => scope.clients.claim()))
})

scope.addEventListener('fetch', (event) => {
  const { request } = event
  const strategy = strategyFor({
    method: request.method,
    url: new URL(request.url),
    origin,
    mode: request.mode,
    isRsc: request.headers.get('rsc') === '1',
  })
  if (strategy === 'pages') event.respondWith(networkFirstPage(event))
  if (strategy === 'files') event.respondWith(cacheFirstFile(event))
})

scope.addEventListener('message', (event) => {
  event.waitUntil(warm(readWarmUrls(event.data)))
})
