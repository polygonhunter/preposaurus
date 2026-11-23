'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'

type SupplyExplainerProps = Readonly<{ children: ReactNode }>

const EXPLAIN_TITLE = 'So wird gerechnet'

// Öffnet das Erklär-Blatt (#219, UX-Konzept §8.1 Punkt 5). Der Knopf ist sichtbar und per Tastatur
// erreichbar, seine Fläche (::after) deckt den ganzen Kopf ab: Ein Tipp auf Kernzahl, „ca.“ oder
// Balken öffnet dasselbe Blatt. Die Balken bleiben dabei für Screenreader eigene Messwerte.
export function SupplyExplainer({ children }: SupplyExplainerProps) {
  const [isOpen, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
  }
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
        className="mt-1 inline-flex min-h-11 items-center text-footnote text-accent after:absolute after:inset-0 after:rounded-group"
      >
        {EXPLAIN_TITLE}
      </button>
      <Sheet
        isOpen={isOpen}
        onClose={close}
        title={EXPLAIN_TITLE}
        actions={
          <Button variant="plain" onClick={close}>
            Schließen
          </Button>
        }
      >
        {children}
      </Sheet>
    </>
  )
}
