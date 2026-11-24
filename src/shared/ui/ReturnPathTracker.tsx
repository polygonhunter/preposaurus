'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { rememberReturnPath } from '../lib/return-path'

// Merkt sich jede Seite im App-Rahmen als Ziel für „Abbrechen“ im Erfassen (#285). Steht nur im
// Rahmen mit Tab-Leiste, Erfassen selbst (auch der Wechsel Foto · Manuell) zählt also nie.
export function ReturnPathTracker() {
  const pathname = usePathname()
  useEffect(() => {
    rememberReturnPath(`${pathname}${window.location.search}`)
  }, [pathname])
  return null
}
