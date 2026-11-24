import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { RowContent, type RowContentProps } from './RowContent'

const INNER = 'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left'
const STACKED_INNER = 'flex-wrap gap-y-2 mittel:flex-nowrap'
const STACKED_ACCESSORY =
  'shrink-0 basis-full mittel:-my-2 mittel:-mr-1 mittel:basis-auto mittel:pl-0'

type RowStaticBodyProps = RowContentProps &
  Readonly<{ accessory: ReactNode; stacks?: boolean | undefined }>

// Zeile ohne eigene Handlung. Inhalt in eigenem Flex-Element: Das ::before der Trennlinie wäre
// sonst in der ersten Zeile ein Flex-Kind und rückte den Text um den Abstand ein.
export function RowStaticBody({ accessory, stacks, ...content }: RowStaticBodyProps) {
  if (stacks !== true) {
    return (
      <div className={INNER}>
        <RowContent {...content} />
        {accessory}
      </div>
    )
  }
  // pl-10 = Piktogramm 28 px + Abstand 12 px: Der Knopf beginnt unter dem Titel.
  return (
    <div className={cx(INNER, STACKED_INNER)}>
      <RowContent {...content} />
      <div className={cx(STACKED_ACCESSORY, content.icon ? 'pl-10' : undefined)}>{accessory}</div>
    </div>
  )
}
