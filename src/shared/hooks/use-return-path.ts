// Ziel für „Abbrechen“ (#285): die zuletzt gemerkte Seite im App-Rahmen. Auf dem Server und vor dem
// Hydrieren die Übersicht, danach der Wert aus dem sessionStorage.
import { useSyncExternalStore } from 'react'
import { FALLBACK_RETURN_PATH, readReturnPath } from '../lib/return-path'

// Der Wert ändert sich nicht, solange Erfassen offen ist: Gemerkt wird nur im App-Rahmen.
const subscribe = () => () => undefined

export function useReturnPath(): string {
  return useSyncExternalStore(subscribe, readReturnPath, () => FALLBACK_RETURN_PATH)
}
