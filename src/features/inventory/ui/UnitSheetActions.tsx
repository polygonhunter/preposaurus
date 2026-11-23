'use client'

import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import { useConsume } from './consume-context'

type UnitSheetActionsProps = Readonly<{
  // Packung für „Verbraucht“ und „Entsorgt“, null ohne Packung
  unitId: string | null
  // Packungen für „Noch gut“: abgelaufen, MHD, ungeprüft. Leer heißt: kein Knopf
  stillGoodIds: readonly string[]
  // Name und Datum für die UndoBar
  name: string
  dateLabel: string
  onDone: () => void
  // Weitere Knöpfe vor „Abbrechen“, z. B. „Datum ändern“
  extra?: ReactNode
}>

// Aktionen im Blatt „Einheit“ (UX-Konzept §8.4, #47): Verbraucht · Entsorgt · Noch gut. Jede
// Aktion schließt das Blatt, danach steht unten „Rückgängig“ statt einer Rückfrage vorher. Ohne
// Verbindung sind die Knöpfe nur per aria-disabled gesperrt: Der Tipp schließt das Blatt, und der
// ConsumeProvider sagt unten, warum es gerade nicht geht (#216, #218).
export function UnitSheetActions({
  unitId,
  stillGoodIds,
  name,
  dateLabel,
  onDone,
  extra,
}: UnitSheetActionsProps) {
  const { consume, discard, markStillGood, isLocked } = useConsume()
  const label = { name, dateLabel }
  const after = (act: () => void) => () => {
    act()
    onDone()
  }
  return (
    <>
      <Button
        disabled={unitId === null}
        aria-disabled={isLocked}
        onClick={after(() => {
          if (unitId !== null) consume({ kind: 'unit', unitId }, label)
        })}
      >
        1 Packung verbraucht
      </Button>
      <Button
        variant="plain"
        disabled={unitId === null}
        aria-disabled={isLocked}
        onClick={after(() => {
          if (unitId !== null) discard(unitId, label)
        })}
      >
        1 Packung entsorgt
      </Button>
      {stillGoodIds.length === 0 ? null : (
        <Button
          variant="plain"
          aria-disabled={isLocked}
          onClick={after(() => {
            markStillGood(stillGoodIds, label)
          })}
        >
          Noch gut
        </Button>
      )}
      {extra}
      <Button variant="plain" onClick={onDone}>
        Abbrechen
      </Button>
    </>
  )
}
