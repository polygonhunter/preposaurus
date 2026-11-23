import Link from 'next/link'
import { DayBar } from '@/shared/ui/DayBar'
import type { OverviewGroup } from '../schemas'
import { coverageText } from './list-text'
import { stockGroupPath } from './overview-paths'

type GroupCoverageItemProps = Readonly<{ group: OverviewGroup; scaleDays: number }>

// Trennlinie wie in Row, eingerückt wie der Text
const SEPARATOR =
  'relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-4 not-first:before:hairline'

// Eine Warengruppe: Name, bei der knappsten das Wort „am knappsten“, darunter der Balken.
export function GroupCoverageItem({ group, scaleDays }: GroupCoverageItemProps) {
  return (
    <li className={SEPARATOR}>
      <Link
        href={stockGroupPath(group.key)}
        className="flex flex-col gap-1.5 px-4 py-[11px] transition-colors duration-150 ease-out active:bg-fill"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 text-body">{group.shortName}</span>
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
      </Link>
    </li>
  )
}
