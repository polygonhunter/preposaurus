'use client'

import type { MouseEvent } from 'react'
import { Icon } from '@/shared/ui/Icon'

type MoveButtonsProps = Readonly<{
  id: string
  name: string
  action: (formData: FormData) => Promise<void>
  isFirst: boolean
  isLast: boolean
}>

const BUTTON =
  'touch-target flex size-9 items-center justify-center rounded-full text-accent transition-opacity duration-150 ease-out active:opacity-60 aria-disabled:text-fg2 aria-disabled:opacity-40'

const stopIfLocked = (isLocked: boolean) => (event: MouseEvent<HTMLButtonElement>) => {
  if (isLocked) event.preventDefault()
}

// Sortieren ohne Ziehen (EIN-04): je ein Knopf rückt den Eintrag eine Stelle nach oben oder unten.
// Ziehen ginge mit Tastatur und Screenreader schlecht, zwei Knöpfe gehen überall. Am Rand nur per
// aria-disabled gesperrt: Ein echtes disabled nähme dem eben gedrückten Knopf den Fokus (#243).
// Rückt die Zeile, führt useFocusRescue der Liste den Fokus zurück auf den Knopf.
export function MoveButtons({ id, name, action, isFirst, isLast }: MoveButtonsProps) {
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        name="richtung"
        value="up"
        aria-disabled={isFirst}
        aria-label={`${name} nach oben`}
        className={BUTTON}
        onClick={stopIfLocked(isFirst)}
      >
        <Icon name="chevron" size={20} className="-rotate-90" />
      </button>
      <button
        type="submit"
        name="richtung"
        value="down"
        aria-disabled={isLast}
        aria-label={`${name} nach unten`}
        className={BUTTON}
        onClick={stopIfLocked(isLast)}
      >
        <Icon name="chevron" size={20} className="rotate-90" />
      </button>
    </form>
  )
}
