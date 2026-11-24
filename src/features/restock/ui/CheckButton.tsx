'use client'

import { CheckCircle } from './CheckCircle'
import { useRestock, type RestockEntry } from './restock-context'

type CheckButtonProps = Readonly<{ entry: RestockEntry; isDone: boolean }>

// Abhaken und wieder öffnen eines gespeicherten Eintrags (NK-04).
export function CheckButton({ entry, isDone }: CheckButtonProps) {
  const { setDone, isLocked } = useRestock()
  return (
    <CheckCircle
      label={entry.label}
      isChecked={isDone}
      isLocked={isLocked}
      onToggle={() => {
        setDone(entry, !isDone)
      }}
    />
  )
}
