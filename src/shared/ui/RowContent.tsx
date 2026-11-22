import type { ReactNode } from 'react'

export type RowContentProps = Readonly<{
  title: ReactNode
  subtitle?: ReactNode
  // Piktogramm links. Die Trennlinie rückt dann auf 52 px ein.
  icon?: ReactNode
  // Rechts: Wert, StatusBadge oder ein Knopf. Ein Link bekommt zusätzlich den Chevron.
  trailing?: ReactNode
}>

// Innenleben einer Row, gleich für Zeile, Link und Knopf.
export function RowContent({ title, subtitle, icon, trailing }: RowContentProps) {
  return (
    <>
      {icon ? <span className="flex size-7 shrink-0 items-center text-fg2">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-body">{title}</span>
        {subtitle ? <span className="block text-footnote text-fg2">{subtitle}</span> : null}
      </span>
      {trailing ? <span className="shrink-0 text-body text-fg2">{trailing}</span> : null}
    </>
  )
}
