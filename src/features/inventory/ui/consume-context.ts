'use client'
// Gemeinsamer Zugang zu „Verbraucht“ und „−1“ für alle Knöpfe einer Seite. Die UndoBar gibt es
// je Seite nur einmal (ConsumeProvider), egal welche Zeile entnommen hat.
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
  isPending: boolean
}

export const ConsumeContext = createContext<ConsumeContextValue | null>(null)

export function useConsume(): ConsumeContextValue {
  const value = useContext(ConsumeContext)
  if (value === null) throw new Error('useConsume braucht einen ConsumeProvider')
  return value
}
