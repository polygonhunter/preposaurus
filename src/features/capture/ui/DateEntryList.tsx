import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { dateEntryKey, dateEntryLabel, type DateEntry } from '../domain/date-entries'
import { MAX_COUNT_PER_DATE } from '../schemas/stock'
import { CountStepper } from './CountStepper'

type DateEntryListProps = Readonly<{
  entries: readonly DateEntry[]
  labelledBy: string
  onCountChange: (key: string, delta: number) => void
}>

// Je Datum eine Zeile „09/2027 · − 2× +“, „Datum fehlt“ zuletzt.
export function DateEntryList({ entries, labelledBy, onCountChange }: DateEntryListProps) {
  if (entries.length === 0) return null
  return (
    <div className="pt-3">
      <Group labelledBy={labelledBy}>
        {entries.map((entry) => {
          const key = dateEntryKey(entry)
          const label = dateEntryLabel(entry)
          return (
            <Row
              key={key}
              title={label}
              trailing={
                <CountStepper
                  label={label}
                  count={entry.count}
                  max={MAX_COUNT_PER_DATE}
                  onChange={(delta) => {
                    onCountChange(key, delta)
                  }}
                />
              }
            />
          )
        })}
      </Group>
    </div>
  )
}
