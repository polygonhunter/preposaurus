'use client'

import { useEffect } from 'react'
import { clearOfflinePages } from '../lib/offline-browser'

// Auf Anmelden und Einrichten (M10-02, #82): Nach dem Abmelden oder einer abgelaufenen Sitzung
// bleibt der letzte Stand des Haushalts nicht im Browser. Der Service Worker löscht ihn zusätzlich,
// sobald er eine dieser Seiten ausliefert.
export function ClearOfflinePages() {
  useEffect(() => {
    void clearOfflinePages()
  }, [])
  return null
}
