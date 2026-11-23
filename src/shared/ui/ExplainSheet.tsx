'use client'

import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Sheet } from './Sheet'

type ExplainTrigger = Readonly<{
  label: string
  // Lage und Fläche des Knopfs. Mit `after:absolute after:inset-0` deckt er einen Block mit
  // `relative` ganz ab, ein Tipp irgendwo darauf öffnet dann das Blatt (#219).
  className: string
  // Die Zahl darunter ist schon sichtbar: Der Knopf liegt nur als Fläche darüber, sein Name steht
  // für Screenreader da
  isLabelHidden?: boolean
}>

type ExplainSheetProps = Readonly<{
  title: string
  trigger: ExplainTrigger
  children: ReactNode
}>

// Erklär-Blatt mit dem Rechenweg einer Zahl (#219, #230, UX-Konzept §8.1 Punkt 5): ein Knopf, per
// Tastatur erreichbar, öffnet ein Blatt mit der Rechnung. Rechnen tut das Blatt nichts, die Texte
// kommen fertig herein.
export function ExplainSheet({ title, trigger, children }: ExplainSheetProps) {
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
        className={trigger.className}
      >
        {trigger.isLabelHidden === true ? (
          <span className="sr-only">{trigger.label}</span>
        ) : (
          trigger.label
        )}
      </button>
      <Sheet
        isOpen={isOpen}
        onClose={close}
        title={title}
        actions={
          <Button variant="plain" onClick={close}>
            Schließen
          </Button>
        }
      >
        <div className="flex flex-col gap-5 pb-1">{children}</div>
      </Sheet>
    </>
  )
}
