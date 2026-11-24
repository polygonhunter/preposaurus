'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/**
 * „Noch eins“ bzw. „Verwerfen“: frischer Stand mit neu geladenen Optionen (Vorbelegung, „Zuletzt
 * genutzt“, das eben angelegte Produkt). `reset` und das Neuladen laufen in einer Transition, der
 * frische Stand erscheint also erst mit den neuen Optionen. Sonst fehlte kurz das Angebot „Zu …
 * hinzufügen“, und wer schnell tippt, legte dasselbe Produkt doppelt an (#272).
 */
export function useFreshRestart(reset: () => void) {
  const router = useRouter()
  const [isReloading, startReload] = useTransition()
  const restart = () => {
    startReload(() => {
      reset()
      router.refresh()
    })
  }
  return { isReloading, restart }
}
