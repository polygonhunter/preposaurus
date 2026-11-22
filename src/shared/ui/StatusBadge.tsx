import { cx } from '@/shared/lib/class-names'

// Ampelfarben aus DESIGN_SYSTEM §3. Welche Farbe zu welchem Zustand gehört, legt das Feature fest.
type StatusTone = 'red' | 'orange' | 'yellow' | 'green' | 'neutral'

const TONE_TEXT: Record<StatusTone, string> = {
  red: 'text-red',
  orange: 'text-orange',
  yellow: 'text-yellow',
  green: 'text-green',
  neutral: 'text-fg2',
}

const TONE_DOT: Record<StatusTone, string> = {
  red: 'bg-red',
  orange: 'bg-orange',
  yellow: 'bg-yellow',
  green: 'bg-green',
  neutral: 'bg-fg2',
}

type StatusBadgeProps = Readonly<{
  tone: StatusTone
  // Pflicht: Zustand nie nur über Farbe („abgelaufen“, „bald fällig“, „Datum fehlt“)
  label: string
}>

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 text-footnote font-semibold',
        TONE_TEXT[tone],
      )}
    >
      <span aria-hidden="true" className={cx('size-2 shrink-0 rounded-full', TONE_DOT[tone])} />
      {label}
    </span>
  )
}
