import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Row } from '@/shared/ui/Row'
import type { RestockItemDto } from '../schemas'
import { CheckButton } from './CheckButton'
import { RemoveButton } from './RemoveButton'
import { captureHref } from './restock-paths'

type RestockItemRowProps = Readonly<{ item: RestockItemDto }>

// Eine Zeile der Liste: Haken links, Name, rechts Entfernen. Erledigte bieten „Erfassen“ an
// („Gekauft und erfassen“, UX-Konzept §8.6), vorbelegt mit der Lebensmittelart (#195).
export function RestockItemRow({ item }: RestockItemRowProps) {
  const entry = { id: item.id, label: item.label, captureTarget: item.captureTarget }
  return (
    <Row
      icon={<CheckButton entry={entry} isDone={item.isDone} />}
      title={item.isDone ? <span className="text-fg2 line-through">{item.label}</span> : item.label}
      accessory={
        <div className="-my-2 -mr-3 flex shrink-0 items-center gap-1">
          {item.isDone ? (
            <ButtonLink href={captureHref(item)} variant="tinted">
              Erfassen<span className="sr-only"> für {item.label}</span>
            </ButtonLink>
          ) : null}
          <RemoveButton entry={entry} />
        </div>
      }
    />
  )
}
