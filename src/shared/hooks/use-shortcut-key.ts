import { createContext, use } from 'react'
import { SHORTCUT_KEYS, type ShortcutAction } from '../lib/keyboard-shortcuts'

// Ob die Tastenkürzel an sind (#254), gesetzt vom App-Rahmen über ShortcutsProvider. Außerhalb des
// Rahmens (z. B. Musterseite) gelten sie als an, wie der Standard.
export const ShortcutsContext = createContext(true)

/** Taste des Kürzels für `aria-keyshortcuts` und `kbd`, oder undefined, wenn Kürzel aus sind. */
export function useShortcutKey(action: ShortcutAction): string | undefined {
  return use(ShortcutsContext) ? SHORTCUT_KEYS[action] : undefined
}
