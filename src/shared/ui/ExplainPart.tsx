import type { ReactNode } from 'react'

type ExplainPartProps = Readonly<{ title: string; children: ReactNode }>

// Ein Abschnitt im Erklär-Blatt (#219, #230): Überschrift wie ein Gruppenkopf, darunter der Text.
export function ExplainPart({ title, children }: ExplainPartProps) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-footnote font-semibold tracking-wide text-fg2 uppercase">{title}</h3>
      {children}
    </section>
  )
}
