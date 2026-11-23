import Link from 'next/link'
import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { DayBar } from '@/shared/ui/DayBar'
import { ExplainSheet } from '@/shared/ui/ExplainSheet'
import type { OverviewGroup } from '../schemas'
import { GroupExplanation } from './GroupExplanation'
import { coverageText } from './list-text'
import { stockGroupPath } from './overview-paths'

type GroupCoverageItemProps = Readonly<{
  group: OverviewGroup
  scaleDays: number
  source: RecommendationSource | null
}>

// Trennlinie wie in Row, eingerückt wie der Text
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-4 not-first:before:hairline'

// Fläche über der Zahl rechts („6,6 von 10 Tagen“), so breit wie deren Spalte samt Rand. Sie liegt
// über der Fläche des Links, ein Tipp auf die Zahl öffnet also das Blatt statt des Vorrats (#230).
const EXPLAIN_AREA = 'absolute right-0 bottom-0 z-10 h-11 w-40 rounded-group'

// Eine Warengruppe: Name, bei der knappsten das Wort „am knappsten“, darunter der Balken. Der Name
// führt (mit seiner Fläche über der ganzen Zeile, über dem Balken) in den Vorrat, die Zahl öffnet
// den Rechenweg. Zwei getrennte Bedienelemente, weil ein Knopf in einem Link nicht erlaubt ist.
export function GroupCoverageItem({ group, scaleDays, source }: GroupCoverageItemProps) {
  return (
    <li className={`${SEPARATOR} transition-colors duration-150 ease-out has-[a:active]:bg-fill`}>
      <div className="flex flex-col gap-1.5 px-4 py-[11px]">
        <span className="flex items-baseline justify-between gap-3">
          <Link
            href={stockGroupPath(group.key)}
            className="min-w-0 text-body after:absolute after:inset-0 after:z-1"
          >
            {group.shortName}
          </Link>
          {group.isTightest ? (
            <span className="shrink-0 text-footnote font-semibold text-fg2">am knappsten</span>
          ) : null}
        </span>
        <DayBar
          label={group.shortName}
          days={group.days}
          scaleDays={scaleDays}
          goalDays={group.goalDays}
          isLimiting={group.isTightest}
          valueText={coverageText(group)}
          isLabelHidden
          valueWidth="coverage"
        />
      </div>
      <ExplainSheet
        title={group.shortName}
        trigger={{
          label: `Rechnung zu ${group.shortName}`,
          className: EXPLAIN_AREA,
          isLabelHidden: true,
        }}
      >
        <GroupExplanation group={group} source={source} />
      </ExplainSheet>
    </li>
  )
}
