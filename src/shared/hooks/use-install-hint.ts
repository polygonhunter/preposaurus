// Zustand des Hinweises „Zum Home-Bildschirm“ (M10-03, #83). Das Ausblenden gilt je Gerät
// (localStorage). Ist der Speicher gesperrt (privates Surfen), gilt es bis zum Neuladen.
import { useSyncExternalStore } from 'react'
import { INSTALL_HINT_DISMISSED_KEY, shouldShowInstallHint } from '../lib/install-hint'

const listeners = new Set<() => void>()
let isDismissedInMemory = false

function readDismissed(): boolean {
  if (isDismissedInMemory) return true
  try {
    return localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === '1'
  } catch {
    // Speicher gesperrt: dann zählt nur das Ausblenden in dieser Sitzung.
    return false
  }
}

function isStandalone(): boolean {
  const isIosHomeScreenApp = (navigator as { standalone?: boolean }).standalone === true
  return isIosHomeScreenApp || window.matchMedia('(display-mode: standalone)').matches
}

function isVisibleNow(): boolean {
  return shouldShowInstallHint({
    userAgent: navigator.userAgent,
    isStandalone: isStandalone(),
    isDismissed: readDismissed(),
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function dismiss(): void {
  isDismissedInMemory = true
  try {
    localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, '1')
  } catch {
    // Speicher gesperrt: Der Hinweis bleibt bis zum Neuladen weg (isDismissedInMemory).
  }
  for (const listener of listeners) listener()
}

export function useInstallHint(): Readonly<{ isVisible: boolean; dismiss: () => void }> {
  const isVisible = useSyncExternalStore(subscribe, isVisibleNow, () => false)
  return { isVisible, dismiss }
}
