import { dateEntryKey, dateEntryLabel } from '../domain/date-entries'
import type { DateShot, PhotoDateEntry } from './photo-capture-state'

type CameraDateChipsProps = Readonly<{
  units: readonly PhotoDateEntry[]
  shots: readonly DateShot[]
}>

const SHOT_TEXT: Record<DateShot['issue'], string> = {
  pending: 'wird gelesen …',
  unreadable: 'nicht lesbar',
  review: 'bitte prüfen',
  'not-read': 'nicht gelesen',
}

const CHIP = 'shrink-0 rounded-full px-3 py-1 text-footnote whitespace-nowrap'

// Chips der MHD-Serie in der Kamera (#64): je Datum mit Anzahl, offene Fotos dahinter. Entschieden
// wird im Schritt Prüfen, hier steht nur, was schon gelesen ist. Ansage per aria-live.
export function CameraDateChips({ units, shots }: CameraDateChipsProps) {
  if (units.length === 0 && shots.length === 0) return null
  return (
    <ul aria-label="Erfasste Daten" aria-live="polite" className="flex flex-wrap gap-2 px-4">
      {units.map((entry) => (
        <li key={dateEntryKey(entry)} className={`${CHIP} bg-fg text-bg`}>
          {dateEntryLabel(entry)} × {entry.count}
        </li>
      ))}
      {shots.map((shot) => (
        <li key={shot.localId} className={`${CHIP} bg-fill text-fg`}>
          {SHOT_TEXT[shot.issue]}
        </li>
      ))}
    </ul>
  )
}
