// Was beim Verlassen des Erfassens verloren ginge (#285). Das Formular meldet seinen Stand, „Abbrechen“
// fragt ihn erst beim Antippen ab. Deshalb kein React-Zustand: Eine Meldung je Tastendruck würde
// sonst die Kopfzeile bei jeder Eingabe neu zeichnen.
import { createContext, use, useEffect } from 'react'

/** Ergebnis von Behalten bzw. Verwerfen: null, wenn es geklappt hat, sonst der Satz für die Maske */
type LeaveStep = () => Promise<string | null>

export type LeaveGuard =
  | Readonly<{ kind: 'none' }>
  /** Eingaben nur auf dem Gerät, sie gingen beim Verlassen verloren */
  | Readonly<{ kind: 'unsaved' }>
  /** Foto-Entwurf auf dem NAS: behalten (zuletzt Geändertes sofort sichern) oder verwerfen */
  | Readonly<{ kind: 'draft'; keep: LeaveStep; discard: LeaveStep }>

export const NO_LEAVE_GUARD: LeaveGuard = { kind: 'none' }

export type LeaveGuardRegistry = Readonly<{
  read: () => LeaveGuard
  register: (guard: LeaveGuard) => void
}>

export function createLeaveGuardRegistry(): LeaveGuardRegistry {
  let current = NO_LEAVE_GUARD
  return {
    read: () => current,
    register: (guard) => {
      current = guard
    },
  }
}

export const LeaveGuardContext = createContext<LeaveGuardRegistry>(createLeaveGuardRegistry())

export const useLeaveGuardRegistry = () => use(LeaveGuardContext)

/** Meldet nach jedem Zeichnen den aktuellen Stand, beim Abbau wieder „nichts zu verlieren“. */
export function useLeaveGuard(guard: LeaveGuard): void {
  const registry = use(LeaveGuardContext)
  useEffect(() => {
    registry.register(guard)
    return () => {
      registry.register(NO_LEAVE_GUARD)
    }
  })
}
