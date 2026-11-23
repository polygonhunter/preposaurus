'use client'

import type { ReactNode } from 'react'
import { ShortcutsContext } from '../hooks/use-shortcut-key'

type ShortcutsProviderProps = Readonly<{ isEnabled: boolean; children: ReactNode }>

// Reicht die Wahl „Tastenkürzel“ (#254) an Suchfeld und Erfassen-Knopf weiter.
export function ShortcutsProvider({ isEnabled, children }: ShortcutsProviderProps) {
  return <ShortcutsContext value={isEnabled}>{children}</ShortcutsContext>
}
