'use client'
// Gemeinsamer Zugang zu Abhaken, Entfernen, „Auf die Liste“ und den Lücken für alle Zeilen der
// Seite. Die UndoBar gibt es nur einmal (RestockProvider), egal welche Zeile gehandelt hat.
import { createContext, useContext } from 'react'
import type {
  GapStatusChange,
  RestockGapDto,
  RestockItemDto,
  RestockSuggestionDto,
} from '../schemas'

export type RestockEntry = Pick<RestockItemDto, 'id' | 'label' | 'captureTarget'>

export type SuggestionEntry = Pick<RestockSuggestionDto, 'productId' | 'label'>

export type GapEntry = Pick<RestockGapDto, 'groupKey' | 'name'>

/** Ein eben gespeicherter Eintrag: „Rückgängig“ und „Wieder zeigen“ brauchen nur ID und Namen. */
export type ListedEntry = Pick<RestockEntry, 'id' | 'label'>

export interface RestockContextValue {
  setDone: (entry: RestockEntry, isDone: boolean) => void
  remove: (entry: RestockEntry) => void
  addSuggestion: (suggestion: SuggestionEntry) => void
  setGapStatus: (gap: GapEntry, status: GapStatusChange['status']) => void
  showGap: (entry: ListedEntry) => void
  /** Läuft gerade eine Änderung oder fehlt die Verbindung */
  isLocked: boolean
}

export const RestockContext = createContext<RestockContextValue | null>(null)

export function useRestock(): RestockContextValue {
  const value = useContext(RestockContext)
  if (value === null) throw new Error('useRestock braucht einen RestockProvider')
  return value
}
