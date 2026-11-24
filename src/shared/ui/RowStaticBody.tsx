import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { RowContent, type RowContentProps } from './RowContent'

const INNER = 'flex min-h-11 w-full items-center gap-3 px-4 py-[11px] text-left'
// Mit Falz steht die Seite auf dem rechten Bildschirm, so schmal wie kompakt (#253): dann wieder
// untereinander wie kompakt (#284).
const STACKED_INNER = 'flex-wrap gap-y-2 mittel:flex-nowrap falz:flex-wrap'
const STACKED_ACCESSORY =
  'shrink-0 basis-full mittel:-my-2 mittel:-mr-1 mittel:basis-auto mittel:pl-0 falz:my-0 falz:mr-0 falz:basis-full'

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
      <div className={cx(STACKED_ACCESSORY, content.icon ? 'pl-10 falz:pl-10' : undefined)}>
        {accessory}
      </div>
    </div>
  )
}
