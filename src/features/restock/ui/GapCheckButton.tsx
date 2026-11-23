'use client'

import { CheckCircle } from './CheckCircle'
import { useRestock, type GapEntry } from './restock-context'

type GapCheckButtonProps = Readonly<{ gap: GapEntry }>

// Haken an einer Lücke bis zum Ziel (#201): speichert sie als erledigt, sie steht dann unter
// „Erledigt“ und die Rückgängig-Zeile bietet „Jetzt erfassen“ an.
export function GapCheckButton({ gap }: GapCheckButtonProps) {
  const { setGapStatus, isLocked } = useRestock()
  return (
    <CheckCircle
      label={gap.name}
      isChecked={false}
      disabled={isLocked}
      onToggle={() => {
        setGapStatus(gap, 'erledigt')
      }}
    />
  )
}
