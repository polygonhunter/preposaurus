import { detailPath } from '@/shared/config/stock-paths'
import { Row } from '@/shared/ui/Row'
import type { DueEntry } from '../schemas'
import { ConsumeButton } from './ConsumeButton'
import { DueEntryActions } from './DueEntryActions'
import { dueEntryLine, dueEntryTitle } from './due-labels'
import { formatDate } from './stock-format'

type DueEntryRowProps = Readonly<{
  entry: DueEntry
  // Abgelaufen: „Verbraucht“, „Entsorgt“ und „Noch gut“ als Knopfreihe unter dem Text
  isExpired: boolean
}>

// Ein Eintrag auf „Bald fällig“ (UX-Konzept §8.2): Text führt zur Lebensmittelart, daneben bzw.
// darunter die Knöpfe. Nicht abgelaufene Einträge haben nur „Verbraucht“.
export function DueEntryRow({ entry, isExpired }: DueEntryRowProps) {
  const [firstUnit] = entry.unitIds
  const dateLabel = entry.bestBefore === null ? undefined : formatDate(entry.bestBefore)
  const content = {
    title: dueEntryTitle(entry),
    subtitle: dueEntryLine(entry),
    action: { href: detailPath(entry.target) },
  }
  if (firstUnit === undefined) return <Row {...content} />
  if (isExpired) {
    return (
      <Row
        {...content}
        footer={
          <DueEntryActions
            unitIds={entry.unitIds}
            name={entry.name}
            dateLabel={dateLabel}
            canConfirmStillGood={entry.canConfirmStillGood}
          />
        }
      />
    )
  }
  return (
    <Row
      {...content}
      accessory={<ConsumeButton unitId={firstUnit} name={entry.name} dateLabel={dateLabel} />}
    />
  )
}
