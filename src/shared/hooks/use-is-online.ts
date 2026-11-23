// Verbindung zum NAS (M10-02, #82). navigator.onLine allein reicht nicht: Ist Tailscale aus, hat
// das Handy WLAN, erreicht das NAS aber nicht. Darum fragt der Hook beim Start /api/health ab und
// wiederholt das ohne Verbindung alle paar Sekunden. Meldet der Browser „online“, gilt das sofort.
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
  if (next === isOnline) return
  isOnline = next
  syncRetry()
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
const goOnline = () => {
  setOnline(true)
}

function start(): void {
  window.addEventListener('offline', goOffline)
  window.addEventListener('online', goOnline)
  if (navigator.onLine) void probe()
  else setOnline(false)
}

function stop(): void {
  window.removeEventListener('offline', goOffline)
  window.removeEventListener('online', goOnline)
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
