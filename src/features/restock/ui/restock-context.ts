'use client'
// Gemeinsamer Zugang zu Abhaken und Entfernen für alle Zeilen der Seite. Die UndoBar gibt es nur
// einmal (RestockProvider), egal welche Zeile abgehakt hat.
import { createContext, useContext } from 'react'
import type { RestockItemDto } from '../schemas'

export type RestockEntry = Pick<RestockItemDto, 'id' | 'label' | 'captureTarget'>

export interface RestockContextValue {
  setDone: (entry: RestockEntry, isDone: boolean) => void
  remove: (entry: RestockEntry) => void
  /** Läuft gerade eine Änderung oder fehlt die Verbindung */
  isLocked: boolean
}

export const RestockContext = createContext<RestockContextValue | null>(null)

export function useRestock(): RestockContextValue {
  const value = useContext(RestockContext)
  if (value === null) throw new Error('useRestock braucht einen RestockProvider')
  return value
}
