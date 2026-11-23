// Verbindung zum NAS (M10-02, #82). navigator.onLine allein reicht nicht: Ist Tailscale aus, hat
// das Handy WLAN, erreicht das NAS aber nicht. Darum fragt der Hook beim Start /api/health ab und
// wiederholt das ohne Verbindung alle paar Sekunden. Meldet der Browser „online“ oder kommt die App
// wieder nach vorn, fragt er sofort nach, statt dem Browser blind zu glauben.
import { useSyncExternalStore } from 'react'

const HEALTH_URL = '/api/health'
const RETRY_INTERVAL_MS = 10_000

let isOnline = true
let retryTimer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function syncRetry(): void {
  if (!isOnline && retryTimer === undefined) {
    retryTimer = setInterval(() => void probe(), RETRY_INTERVAL_MS)
  }
  if (isOnline && retryTimer !== undefined) {
    clearInterval(retryTimer)
    retryTimer = undefined
  }
}

function setOnline(next: boolean): void {
  const hasChanged = next !== isOnline
  isOnline = next
  // Auch ohne Wechsel: Nach einem Neustart des Hooks (alle Abonnenten weg und wieder da) muss das
  // Nachfragen ohne Verbindung wieder laufen.
  syncRetry()
  if (!hasChanged) return
  for (const listener of listeners) listener()
}

async function probe(): Promise<void> {
  try {
    const response = await fetch(HEALTH_URL, { cache: 'no-store' })
    // Eine Antwort, die vor dem Wegfall des Netzes losging, zählt nicht mehr.
    setOnline(response.ok && navigator.onLine)
  } catch {
    // Kein Netz oder NAS nicht erreichbar: genau das soll der Hinweis zeigen.
    setOnline(false)
  }
}

const goOffline = () => {
  setOnline(false)
}
// WLAN zurück heißt nicht NAS erreichbar (Tailscale aus): erst nachfragen, dann freigeben.
const goOnline = () => {
  void probe()
}
const recheckWhenVisible = () => {
  if (document.visibilityState === 'visible') void probe()
}

function start(): void {
  window.addEventListener('offline', goOffline)
  window.addEventListener('online', goOnline)
  document.addEventListener('visibilitychange', recheckWhenVisible)
  if (navigator.onLine) void probe()
  else setOnline(false)
}

function stop(): void {
  window.removeEventListener('offline', goOffline)
  window.removeEventListener('online', goOnline)
  document.removeEventListener('visibilitychange', recheckWhenVisible)
  clearInterval(retryTimer)
  retryTimer = undefined
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) start()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

/** Auf dem Server und beim ersten Rendern gilt „verbunden“, damit nichts flackert. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isOnline,
    () => true,
  )
}
