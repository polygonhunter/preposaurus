import { cx } from '@/shared/lib/class-names'
import { Icon } from '@/shared/ui/Icon'

type CheckCircleProps = Readonly<{
  label: string
  isChecked: boolean
  isLocked: boolean
  onToggle: () => void
}>

// Runder Haken wie in einer Erinnerungsliste, für Einträge und Lücken. Als Checkbox angesagt, damit
// der Zustand ohne Farbe hörbar ist; die Trefferfläche ist 44 × 44 px. Gesperrt nur per
// aria-disabled, damit der Fokus beim Speichern bleibt (#218, #269).
export function CheckCircle({ label, isChecked, isLocked, onToggle }: CheckCircleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      aria-label={label}
      aria-disabled={isLocked}
      onClick={onToggle}
      className={cx(
        'touch-target flex size-6 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 ease-out aria-disabled:opacity-60',
        isChecked ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
      )}
    >
      {isChecked ? <Icon name="check" size={16} /> : null}
    </button>
  )
}
