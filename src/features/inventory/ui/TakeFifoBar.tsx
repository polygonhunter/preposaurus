'use client'

import { Button } from '@/shared/ui/Button'
import { useConsume } from './consume-context'

type TakeFifoBarProps = Readonly<{
  name: string
  unitId: string
  // Datum der Packung, z. B. „11/2027“
  dateLabel: string
}>

// „1 entnehmen · MHD“ fest unten im Detail (DESIGN_SYSTEM §7, UX-Konzept §8.4): nimmt die
// Packung mit dem frühesten MHD. Liegt über der Tab-Leiste, die UndoBar darüber. `data-bottom-bar`
// hält per scroll-padding Fokus und Sprungziele über dem Knopf (globals.css, WCAG 2.4.11). In der
// Stufe mittel klebt er unten in der Detail-Hälfte, die für sich rollt (M12-05).
export function TakeFifoBar({ name, unitId, dateLabel }: TakeFifoBarProps) {
  const { consume, isLocked } = useConsume()
  return (
    <div
      data-bottom-bar
      className="sticky bottom-[calc(58px+env(safe-area-inset-bottom))] z-10 mt-6 px-4 pb-2 nur-mittel:bottom-2 breit:bottom-4 breit:px-6"
    >
      <Button
        aria-disabled={isLocked}
        onClick={() => {
          consume({ kind: 'unit', unitId }, { name, dateLabel })
        }}
      >
        {`1 entnehmen · ${dateLabel}`}
      </Button>
    </div>
  )
}
