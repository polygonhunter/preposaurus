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
  // Name der Zahl, wenn er nicht neben dem Balken steht (z. B. „Menge reicht“ im Kopf der Liste).
  // Screenreader lesen ihn vor dem Wert, damit die Zahl nicht ohne Bedeutung bleibt (#209).
  valueLabel?: string
  // Beschriftung steht schon darüber (z. B. lange Warengruppen-Namen): nur für Screenreader
  isLabelHidden?: boolean
  // Breite der Wert-Spalte, für alle Balken einer Liste gleich: „9,4 Tage“ oder „6,6 von 10 Tagen“.
  // So enden die Spuren an derselben Stelle und die Zielmarken fluchten (#218).
  valueWidth?: ValueWidth
}>

type ValueWidth = 'days' | 'coverage'

const VALUE_WIDTH: Record<ValueWidth, string> = { days: 'min-w-20', coverage: 'min-w-36' }

export function DayBar(props: DayBarProps) {
  const { label, days, scaleDays, goalDays, isLimiting, valueText, isLabelHidden } = props
  const valueWidth = VALUE_WIDTH[props.valueWidth ?? 'days']
  const text = valueText ?? `${String(days)} Tage`
  const spoken = props.valueLabel === undefined ? text : `${props.valueLabel} ${text}`
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
        aria-valuetext={
          goalDays === undefined ? spoken : `${spoken}, Ziel ${String(goalDays)} Tage`
        }
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
      <span className={cx('text-right font-semibold whitespace-nowrap tabular-nums', valueWidth)}>
        {text}
      </span>
    </div>
  )
}
