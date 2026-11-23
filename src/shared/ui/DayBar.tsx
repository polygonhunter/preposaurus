import { cx } from '@/shared/lib/class-names'
import { toPercent } from '@/shared/lib/scale'

type DayBarProps = Readonly<{
  label: string
  days: number
  // Ende der Skala in Tagen, für alle Balken einer Liste gleich
  scaleDays: number
  goalDays?: number
  // Dieser Balken begrenzt den Vorrat und wird orange
  isLimiting?: boolean
  // Text rechts, z. B. „9,6 T“. Ohne Angabe die Zahl der Tage.
  valueText?: string
  // Beschriftung steht schon darüber (z. B. lange Warengruppen-Namen): nur für Screenreader
  isLabelHidden?: boolean
}>

export function DayBar(props: DayBarProps) {
  const { label, days, scaleDays, goalDays, isLimiting, valueText, isLabelHidden } = props
  const text = valueText ?? `${String(days)} Tage`
  return (
    <div
      className={cx(
        'grid items-center gap-x-2.5 text-callout',
        isLabelHidden ? 'grid-cols-[1fr_auto]' : 'grid-cols-[4rem_1fr_auto]',
      )}
    >
      {isLabelHidden ? null : <span>{label}</span>}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={scaleDays}
        aria-valuenow={Math.min(days, scaleDays)}
        aria-valuetext={goalDays === undefined ? text : `${text}, Ziel ${String(goalDays)} Tage`}
        className="relative h-2.5 rounded-full bg-fill"
      >
        <div
          className={cx(
            'absolute inset-y-0 left-0 rounded-full',
            isLimiting ? 'bg-bar-warn' : 'bg-bar',
          )}
          style={{ width: `${String(toPercent(days, scaleDays))}%` }}
        />
        {goalDays === undefined ? null : (
          <div
            className="absolute -inset-y-[5px] w-0.5 rounded-full bg-fg"
            style={{ left: `${String(toPercent(goalDays, scaleDays))}%` }}
          />
        )}
      </div>
      <span className="min-w-14 text-right font-semibold">{text}</span>
    </div>
  )
}
