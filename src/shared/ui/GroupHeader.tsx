import type { ReactNode } from 'react'

type GroupHeaderProps = Readonly<{
  id?: string
  children: ReactNode
  // Rechts: Link in Akzent („Alle 18“) oder eine Summe
  trailing?: ReactNode
}>

export function GroupHeader({ id, children, trailing }: GroupHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 px-8 pt-[22px] pb-[7px] breit:px-10">
      <h2 id={id} className="text-footnote tracking-wide text-fg2 uppercase">
        {children}
      </h2>
      {trailing ? <div className="text-callout text-fg2">{trailing}</div> : null}
    </div>
  )
}
