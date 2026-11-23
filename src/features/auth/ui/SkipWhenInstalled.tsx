'use client'
import { useEffect, useRef } from 'react'
import { isStandaloneDisplay } from '@/shared/hooks/use-install-hint'
import { continueSetupAction } from '../actions/continue-setup-action'

// Schritt „Zum Home-Bildschirm“ (#40): Ob Preposaurus schon als App läuft, weiß nur der Browser.
// Dann gibt es nichts zu zeigen, und der Schritt erledigt sich selbst wie mit „Erledigt“.
export function SkipWhenInstalled() {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (isStandaloneDisplay()) formRef.current?.requestSubmit()
  }, [])
  return (
    <form ref={formRef} action={continueSetupAction} hidden>
      <input type="hidden" name="schritt" value="home-bildschirm" />
    </form>
  )
}
