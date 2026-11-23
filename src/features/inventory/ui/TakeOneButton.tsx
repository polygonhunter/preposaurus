'use client'

import { Button } from '@/shared/ui/Button'
import type { StockTarget } from '../schemas/shared'
import { useConsume } from './consume-context'

type TakeOneButtonProps = Readonly<{ target: StockTarget; name: string }>

// „−1“ in der Vorratszeile (UX-Konzept §8.3, F3): nimmt die Packung mit dem frühesten MHD.
export function TakeOneButton({ target, name }: TakeOneButtonProps) {
  const { consume, isLocked } = useConsume()
  return (
    <Button
      variant="tinted"
      aria-label={`1 Packung ${name} entnehmen`}
      aria-disabled={isLocked}
      onClick={() => {
        consume({ kind: 'target', target }, { name })
      }}
    >
      −1
    </Button>
  )
}
