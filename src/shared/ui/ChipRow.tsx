import type { ReactNode } from 'react'

type ChipRowProps = Readonly<{ label: string; children: ReactNode }>

// Eine Reihe Chips, waagerecht scrollbar statt umbrechend.
export function ChipRow({ label, children }: ChipRowProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-2 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] breit:px-6"
    >
      {children}
    </div>
  )
}
