'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../lib/offline-browser'

type ServiceWorkerRegistrarProps = Readonly<{ isEnabled: boolean }>

// Meldet den Service Worker an (M10-01, #81), nur im Produktionsbuild.
export function ServiceWorkerRegistrar({ isEnabled }: ServiceWorkerRegistrarProps) {
  useEffect(() => {
    if (!isEnabled) return
    void registerServiceWorker()
  }, [isEnabled])
  return null
}
