'use client'

import { Button } from '@/shared/ui/Button'
import { useConsume } from './consume-context'

type DueEntryActionsProps = Readonly<{
  unitIds: readonly string[]
  // Name für UndoBar und Screenreader, z. B. „Walnüsse“
  name: string
  // Datum des Eintrags für die UndoBar, z. B. „01.11.2026“
  dateLabel?: string | undefined
  // Nur bei abgelaufenem MHD, nie beim Verbrauchsdatum (ROT-06)
  canConfirmStillGood: boolean
}>

// Knöpfe eines abgelaufenen Eintrags auf „Bald fällig“ (UX-Konzept §8.2, F4, #47): Verbraucht und
// Entsorgt nehmen je eine Packung, „Noch gut“ prüft alle Packungen des Eintrags. Alle sichtbar,
// ohne „Mehr“ und ohne Wischen (UX §14 Nr. 14). Gesperrt nur per aria-disabled: Fokus bleibt, und
// ohne Verbindung sagt ein Tipp warum (ConsumeProvider, #216).
export function DueEntryActions({
  unitIds,
  name,
  dateLabel,
  canConfirmStillGood,
}: DueEntryActionsProps) {
  const { consume, discard, markStillGood, isLocked } = useConsume()
  const [first] = unitIds
  if (first === undefined) return null
  const label = { name, dateLabel }
  return (
    <>
      <Button
        variant="tinted"
        aria-label={`1 Packung ${name} verbraucht`}
        aria-disabled={isLocked}
        onClick={() => {
          consume({ kind: 'unit', unitId: first }, label)
        }}
      >
        Verbraucht
      </Button>
      <Button
        variant="tinted"
        aria-label={`1 Packung ${name} entsorgt`}
        aria-disabled={isLocked}
        onClick={() => {
          discard(first, label)
        }}
      >
        Entsorgt
      </Button>
      {canConfirmStillGood ? (
        <Button
          variant="tinted"
          aria-label={`${name} noch gut`}
          aria-disabled={isLocked}
          onClick={() => {
            markStillGood(unitIds, label)
          }}
        >
          Noch gut
        </Button>
      ) : null}
    </>
  )
}
