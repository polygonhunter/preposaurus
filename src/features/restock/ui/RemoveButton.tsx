'use client'

import { Icon } from '@/shared/ui/Icon'
import { useRestock, type RestockEntry } from './restock-context'

type RemoveButtonProps = Readonly<{ entry: RestockEntry }>

// Eintrag entfernen: Piktogramm X, Name für Screenreader mit dem Eintrag.
export function RemoveButton({ entry }: RemoveButtonProps) {
  const { remove, isLocked } = useRestock()
  return (
    <button
      type="button"
      aria-label={`${entry.label} entfernen`}
      aria-disabled={isLocked}
      onClick={() => {
        remove(entry)
      }}
      className="flex size-11 items-center justify-center text-fg2 transition-opacity duration-150 ease-out active:opacity-60 aria-disabled:opacity-40"
    >
      <Icon name="close" size={20} />
    </button>
  )
}
