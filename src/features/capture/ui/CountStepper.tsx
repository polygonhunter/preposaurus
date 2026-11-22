import { Icon } from '@/shared/ui/Icon'

type CountStepperProps = Readonly<{
  /** Wofür gezählt wird, z. B. „09/2027“. Steht in den Namen der Knöpfe. */
  label: string
  count: number
  max: number
  onChange: (delta: number) => void
}>

const STEP_BUTTON =
  'touch-target flex size-8 items-center justify-center rounded-full bg-fill text-accent transition-opacity duration-150 ease-out active:opacity-60 disabled:cursor-not-allowed disabled:opacity-40'

// Anzahl mit − und + (UX §8.5 „Chip je Datum mit Anzahl“). Bei 1 entfernt − den Eintrag.
export function CountStepper({ label, count, max, onChange }: CountStepperProps) {
  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        aria-label={count === 1 ? `${label} entfernen` : `Eine Packung weniger mit ${label}`}
        className={STEP_BUTTON}
        onClick={() => {
          onChange(-1)
        }}
      >
        <Icon name="minus" size={18} />
      </button>
      <span className="min-w-8 text-center text-headline text-fg">{count}×</span>
      <button
        type="button"
        aria-label={`Eine Packung mehr mit ${label}`}
        disabled={count >= max}
        className={STEP_BUTTON}
        onClick={() => {
          onChange(1)
        }}
      >
        <Icon name="plus" size={18} />
      </button>
    </span>
  )
}
