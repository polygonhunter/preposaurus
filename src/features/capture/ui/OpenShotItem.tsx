import { StatusBadge } from '@/shared/ui/StatusBadge'
import { dateEntryLabel } from '../domain/date-entries'
import type { ReviewReason } from '../domain/plausibility'
import { OpenShotActions, type ShotHandlers } from './OpenShotActions'
import type { DateShot } from './photo-capture-state'

type OpenShotItemProps = Readonly<{ shot: DateShot; number: number; handlers: ShotHandlers }>

const REASONS: Record<ReviewReason, string> = {
  'in-past': 'liegt in der Vergangenheit',
  'far-from-typical': 'ungewöhnlich weit in der Zukunft',
  'too-far-ahead': 'sehr weit in der Zukunft',
  'low-confidence': 'schwer lesbar',
}

function reviewTitle({ bestBefore, reasons }: DateShot): string {
  const date = bestBefore === null ? '' : dateEntryLabel({ bestBefore })
  return `${date} · bitte prüfen: ${reasons.map((reason) => REASONS[reason]).join(', ')}`
}

function title(shot: DateShot): string {
  switch (shot.issue) {
    case 'pending':
      return 'wird gelesen …'
    case 'review':
      return reviewTitle(shot)
    case 'unreadable':
      return 'nicht lesbar: nochmal oder eintippen'
    case 'not-read':
      return 'nicht gelesen: eintippen oder „Datum fehlt“'
  }
}

// Ein MHD-Foto, das noch entschieden werden muss (#65). Gelb mit Wort, nie nur Farbe.
export function OpenShotItem({ shot, number, handlers }: OpenShotItemProps) {
  const tone = shot.issue === 'pending' ? 'neutral' : 'yellow'
  return (
    <li data-focus-row={shot.localId} className="flex flex-col gap-2 px-4 py-3">
      <span className="text-body">Packung {number}</span>
      <StatusBadge tone={tone} label={title(shot)} />
      <OpenShotActions issue={shot.issue} handlers={handlers} />
    </li>
  )
}
