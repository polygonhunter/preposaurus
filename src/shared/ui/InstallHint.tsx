'use client'

import { useInstallHint } from '../hooks/use-install-hint'
import { INSTALL_HINT_TEXT, INSTALL_HINT_TITLE } from '../lib/install-hint'
import { Button } from './Button'

const HEADING_ID = 'hinweis-home-bildschirm'

// Hinweis „Zum Home-Bildschirm“ auf der Übersicht (M10-03, #83, UMSETZUNG M10-03): nur im
// iPhone-Safari, nicht in der installierten App, einmal ausgeblendet bleibt er weg.
export function InstallHint() {
  const { isVisible, dismiss } = useInstallHint()
  if (!isVisible) return null
  return (
    <section
      aria-labelledby={HEADING_ID}
      className="mx-4 mb-4 rounded-group bg-surface px-4 pt-3 breit:mx-6 breit:border breit:border-line"
    >
      <h2 id={HEADING_ID} className="text-headline">
        {INSTALL_HINT_TITLE}
      </h2>
      <p className="pt-1 text-callout text-fg2">{INSTALL_HINT_TEXT}</p>
      <Button variant="plain" onClick={dismiss} className="-ml-1">
        Ausblenden
      </Button>
    </section>
  )
}
