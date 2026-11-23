import { cx } from '@/shared/lib/class-names'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Row } from '@/shared/ui/Row'
import type { RestockItemDto } from '../schemas'
import { CheckButton } from './CheckButton'
import { RemoveButton } from './RemoveButton'
import { captureHref } from './restock-paths'
import { formatGapAmount } from './restock-text'

type RestockItemRowProps = Readonly<{ item: RestockItemDto }>

// Eine Zeile der Liste: Haken links, Name, rechts Entfernen. Erledigte bieten „Erfassen“ an
// („Gekauft und erfassen“, UX-Konzept §8.6), vorbelegt mit der Lebensmittelart (#195). Eine
// abgehakte Lücke nennt ihre Menge und hat kein Entfernen: Wieder öffnen nimmt sie zurück (#201).
export function RestockItemRow({ item }: RestockItemRowProps) {
  const entry = { id: item.id, label: item.label, captureTarget: item.captureTarget }
  const isGap = item.source === 'ziel'
  return (
    <Row
      icon={<CheckButton entry={entry} isDone={item.isDone} />}
      title={item.isDone ? <span className="text-fg2 line-through">{item.label}</span> : item.label}
      subtitle={item.amount === null ? undefined : formatGapAmount(item.amount)}
      accessory={
        <div className={cx('-my-2 flex shrink-0 items-center gap-1', isGap ? '-mr-1' : '-mr-3')}>
          {item.isDone ? (
            <ButtonLink href={captureHref(item)} variant="tinted">
              Erfassen<span className="sr-only"> für {item.label}</span>
            </ButtonLink>
          ) : null}
          {isGap ? null : <RemoveButton entry={entry} />}
        </div>
      }
    />
  )
}
