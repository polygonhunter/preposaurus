'use client'

import { Button } from '@/shared/ui/Button'
import { useRestock, type ListedEntry } from './restock-context'

type ShowGapButtonProps = Readonly<{ entry: ListedEntry }>

// „Wieder zeigen“ unter „Ausgeblendet“ (#201): Der Eintrag geht weg, die Lücke ist wieder live da.
export function ShowGapButton({ entry }: ShowGapButtonProps) {
  const { showGap, isLocked } = useRestock()
  return (
    <Button
      variant="tinted"
      disabled={isLocked}
      onClick={() => {
        showGap(entry)
      }}
    >
      Wieder zeigen<span className="sr-only"> {entry.label}</span>
    </Button>
  )
}
