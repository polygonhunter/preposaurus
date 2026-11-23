'use client'

import { Button } from '@/shared/ui/Button'
import { useConsume } from './consume-context'

type ConsumeButtonProps = Readonly<{
  unitId: string
  // Name für UndoBar und Screenreader, z. B. „Haferdrink“
  name: string
  // Datum des Eintrags für die UndoBar, z. B. „04.12.2026“
  dateLabel?: string | undefined
}>

// „Verbraucht“ je Zeile auf „Bald fällig“ (UX-Konzept §8.2, F4): nimmt eine Packung des Eintrags.
export function ConsumeButton({ unitId, name, dateLabel }: ConsumeButtonProps) {
  const { consume, isLocked } = useConsume()
  return (
    <Button
      variant="tinted"
      aria-label={`1 Packung ${name} verbraucht`}
      aria-disabled={isLocked}
      onClick={() => {
        consume({ kind: 'unit', unitId }, { name, dateLabel })
      }}
    >
      Verbraucht
    </Button>
  )
}
