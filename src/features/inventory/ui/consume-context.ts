'use client'
// Gemeinsamer Zugang zu „Verbraucht“, „−1“, „Entsorgt“ und „Noch gut“ für alle Knöpfe einer Seite.
// Die UndoBar gibt es je Seite nur einmal (ConsumeProvider), egal welche Zeile gehandelt hat.
import { createContext, useContext } from 'react'
import type { ConsumeRequest } from '../schemas'

/** Was die UndoBar nennt: „Nudeln: 1 Packung verbraucht (11/2027)“ */
export interface TakenLabel {
  name: string
  /** Datum der Packung, falls die Zeile es kennt. Bei „−1“ liefert es der Server. */
  dateLabel?: string | undefined
}

export interface ConsumeContextValue {
  consume: (request: ConsumeRequest, label: TakenLabel) => void
  discard: (unitId: string, label: TakenLabel) => void
  /** „Noch gut“ für alle genannten Packungen eines Eintrags (#47) */
  markStillGood: (unitIds: readonly string[], label: TakenLabel) => void
  /** Eine Aktion läuft gerade, oder es gibt keine Verbindung zum NAS (M10-02) */
  isLocked: boolean
}

export const ConsumeContext = createContext<ConsumeContextValue | null>(null)

export function useConsume(): ConsumeContextValue {
  const value = useContext(ConsumeContext)
  if (value === null) throw new Error('useConsume braucht einen ConsumeProvider')
  return value
}
