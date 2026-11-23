// Ist das Fenster in der Stufe „breit“ oder darüber? Nur für Fälle, in denen CSS allein nicht reicht,
// etwa wenn eine Komponente erst ab „breit“ eingehängt werden soll (Formular neben der Kamera).
// Der Wert gleicht der Variante `breit:` in globals.css. Auf dem Server und beim Hydrieren gilt
// „nicht breit“, so bleibt die Seite kompakt unverändert.
import { useSyncExternalStore } from 'react'

const BREIT_QUERY = '(width >= 900px)'

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(BREIT_QUERY)
  query.addEventListener('change', listener)
  return () => {
    query.removeEventListener('change', listener)
  }
}

const isBreitNow = () => window.matchMedia(BREIT_QUERY).matches

export function useIsBreit(): boolean {
  return useSyncExternalStore(subscribe, isBreitNow, () => false)
}
