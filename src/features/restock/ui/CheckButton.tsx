'use client'

import { cx } from '@/shared/lib/class-names'
import { Icon } from '@/shared/ui/Icon'
import { useRestock, type RestockEntry } from './restock-context'

type CheckButtonProps = Readonly<{ entry: RestockEntry; isDone: boolean }>

// Abhaken (NK-04): runder Haken wie in einer Erinnerungsliste. Als Checkbox angesagt, damit der
// Zustand ohne Farbe hörbar ist; die Trefferfläche ist 44 × 44 px.
export function CheckButton({ entry, isDone }: CheckButtonProps) {
  const { setDone, isLocked } = useRestock()
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isDone}
      aria-label={entry.label}
      disabled={isLocked}
      onClick={() => {
        setDone(entry, !isDone)
      }}
      className={cx(
        'touch-target flex size-6 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 ease-out disabled:opacity-60',
        isDone ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
      )}
    >
      {isDone ? <Icon name="check" size={16} /> : null}
    </button>
  )
}
