'use client'

import type { ReactNode } from 'react'
import { useActiveChipInView } from '@/shared/hooks/use-active-chip-in-view'

type ChipRowProps = Readonly<{ label: string; children: ReactNode }>

// Eine Reihe Chips, waagerecht scrollbar statt umbrechend. Der aktive Chip bleibt im Bild.
export function ChipRow({ label, children }: ChipRowProps) {
  const rowRef = useActiveChipInView<HTMLDivElement>()
  return (
    <div
      ref={rowRef}
      role="group"
      aria-label={label}
      className="flex gap-2 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] breit:px-6"
    >
      {children}
    </div>
  )
}
