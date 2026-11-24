'use client'
import { useId } from 'react'
import type { BestBefore } from '@/features/inventory/domain/unit'
import { todayInBerlin } from '@/shared/lib/dates'
import { QUICK_PICKS, quickPickBestBefore, type QuickPick } from '../domain/best-before'

type BestBeforeQuickPicksProps = Readonly<{
  onPick: (bestBefore: BestBefore) => void
}>

const PICK_TEXT: Record<QuickPick, { short: string; name: string }> = {
  'plus-6-months': { short: '+6 Mon.', name: 'in 6 Monaten (geschätzt)' },
  'plus-1-year': { short: '+1 J.', name: 'in 1 Jahr (geschätzt)' },
  'plus-2-years': { short: '+2 J.', name: 'in 2 Jahren (geschätzt)' },
}

// Schnellknöpfe „+6 Mon. · +1 J. · +2 J.“ unter dem MHD-Feld (UX §8.5 F2, #180): eine
// ausdrücklich gewählte Schätzung, etwa für selbst Eingekochtes oder lose Ware ohne Aufdruck.
// Nur auf Tippen, nie vorbelegt. Das Datum ist geschätzt, monatsgenau und steht mit „ca.“ da.
// Der Name beginnt mit dem sichtbaren Text (WCAG 2.5.3), dann „in 6 Monaten (geschätzt)“.
export function BestBeforeQuickPicks({ onPick }: BestBeforeQuickPicksProps) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-2">
      <span id={labelId} className="text-footnote text-fg2">
        Kein Aufdruck? Geschätzt ab heute:
      </span>
      {QUICK_PICKS.map((pick) => (
        <button
          key={pick}
          type="button"
          aria-label={`${PICK_TEXT[pick].short}: ${PICK_TEXT[pick].name}`}
          onClick={() => {
            onPick(quickPickBestBefore(todayInBerlin(new Date()), pick))
          }}
          className="touch-target min-w-11 rounded-full bg-fill px-3 py-1.5 text-callout font-semibold text-accent"
        >
          {PICK_TEXT[pick].short}
        </button>
      ))}
    </div>
  )
}
