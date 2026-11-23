import { cx } from '@/shared/lib/class-names'
import { Icon } from '@/shared/ui/Icon'

type CheckCircleProps = Readonly<{
  label: string
  isChecked: boolean
  disabled: boolean
  onToggle: () => void
}>

// Runder Haken wie in einer Erinnerungsliste, für Einträge und Lücken. Als Checkbox angesagt, damit
// der Zustand ohne Farbe hörbar ist; die Trefferfläche ist 44 × 44 px.
export function CheckCircle({ label, isChecked, disabled, onToggle }: CheckCircleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'touch-target flex size-6 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 ease-out disabled:opacity-60',
        isChecked ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
      )}
    >
      {isChecked ? <Icon name="check" size={16} /> : null}
    </button>
  )
}
