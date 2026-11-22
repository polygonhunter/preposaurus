import { DayBar } from '@/shared/ui/DayBar'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Sparkline } from '@/shared/ui/Sparkline'
import { StatTiles } from '@/shared/ui/StatTiles'

const DUE_TILES = [
  { value: '2', label: 'abgelaufen' },
  { value: '3', label: 'diese Woche' },
  { value: '5', label: 'diesen Monat' },
  { value: '9', label: 'in 3 Monaten' },
]

const SUPPLY_HISTORY = [6, 7, 7, 9, 8, 10, 11, 10, 12]

export function DataSection() {
  return (
    <>
      <GroupHeader>Reichweite</GroupHeader>
      <div className="mx-4 flex flex-col gap-3 rounded-group bg-surface p-4">
        <p className="text-body text-fg2">Euer Vorrat reicht für</p>
        <p className="text-hero">
          9<span className="ml-1.5 text-title2">Tage</span>
        </p>
        <DayBar label="Essen" days={12} scaleDays={14} goalDays={10} />
        <DayBar label="Wasser" days={9} scaleDays={14} goalDays={10} isLimiting />
      </div>
      <GroupHeader>Kennzahlen</GroupHeader>
      <StatTiles tiles={DUE_TILES} />
      <GroupHeader>Verlauf</GroupHeader>
      <div className="mx-4 rounded-group bg-surface p-4">
        <Sparkline
          values={SUPPLY_HISTORY}
          label="Tage versorgt, in neun Wochen von 6 auf 12 gestiegen"
          startLabel="Sep."
          endLabel="Nov."
        />
      </div>
    </>
  )
}
