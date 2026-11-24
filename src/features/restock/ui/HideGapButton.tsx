'use client'

import { Button } from '@/shared/ui/Button'
import { useRestock, type GapEntry } from './restock-context'

type HideGapButtonProps = Readonly<{ gap: GapEntry }>

// „Ausblenden“ an einer Lücke bis zum Ziel (UX-Konzept §8.6, #201): verdeckt sie, bis sich die
// Lage ändert. Der Name der Warengruppe steht für Screenreader mit im Knopf.
export function HideGapButton({ gap }: HideGapButtonProps) {
  const { setGapStatus, isLocked } = useRestock()
  return (
    <Button
      variant="tinted"
      aria-disabled={isLocked}
      onClick={() => {
        setGapStatus(gap, 'ausgeblendet')
      }}
    >
      Ausblenden<span className="sr-only"> {gap.name}</span>
    </Button>
  )
}
