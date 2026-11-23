import { Icon } from '@/shared/ui/Icon'

type MoveButtonsProps = Readonly<{
  id: string
  name: string
  action: (formData: FormData) => Promise<void>
  isFirst: boolean
  isLast: boolean
}>

const BUTTON =
  'touch-target flex size-9 items-center justify-center rounded-full text-accent transition-opacity duration-150 ease-out active:opacity-60 disabled:text-fg2 disabled:opacity-40'

// Sortieren ohne Ziehen (EIN-04): je ein Knopf rückt den Eintrag eine Stelle nach oben oder unten.
// Ziehen ginge mit Tastatur und Screenreader schlecht, zwei Knöpfe gehen überall.
export function MoveButtons({ id, name, action, isFirst, isLast }: MoveButtonsProps) {
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        name="richtung"
        value="up"
        disabled={isFirst}
        aria-label={`${name} nach oben`}
        className={BUTTON}
      >
        <Icon name="chevron" size={20} className="-rotate-90" />
      </button>
      <button
        type="submit"
        name="richtung"
        value="down"
        disabled={isLast}
        aria-label={`${name} nach unten`}
        className={BUTTON}
      >
        <Icon name="chevron" size={20} className="rotate-90" />
      </button>
    </form>
  )
}
