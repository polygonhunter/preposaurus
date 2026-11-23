'use client'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import type { UnitDateGroup } from '@/features/inventory/schemas'
import { todayInBerlin } from '@/shared/lib/dates'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { changeUnitDatesAction } from '../actions/change-unit-dates-action'
import { parseBestBefore } from '../domain/best-before'
import { PARSE_MESSAGES } from './best-before-messages'
import { CountStepper } from './CountStepper'

type UnitDateFormProps = Readonly<{
  group: UnitDateGroup
  // Detailseite, zu der es nach dem Speichern zurückgeht
  backHref: string
}>

const EMPTY_MESSAGE = 'Bitte gebt das Datum ein, wie es aufgedruckt ist.'
const STILL_GOOD_NOTE = 'Mit einem neuen Datum gilt „Noch gut“ für diese Packungen nicht mehr.'

// Datum ändern bzw. nachtragen (#49, #116): eine Eingabe wie beim Erfassen (Tag, Monat oder Jahr),
// für alle oder einige Packungen der Datumszeile. Es wird nie ein Datum vorgeschlagen.
export function UnitDateForm({ group, backHref }: UnitDateFormProps) {
  const router = useRouter()
  const countId = useId()
  const total = group.unitIds.length
  const [text, setText] = useState('')
  const [count, setCount] = useState(total)
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  function save() {
    const parsed = parseBestBefore(text, todayInBerlin(new Date()))
    if (!parsed.ok) {
      setError(parsed.error.kind === 'empty' ? EMPTY_MESSAGE : PARSE_MESSAGES[parsed.error.kind])
      return
    }
    setError(undefined)
    const { date, precision } = parsed.value
    startTransition(async () => {
      const result = await changeUnitDatesAction({
        unitIds: group.unitIds.slice(0, count),
        bestBefore: { date, precision },
      })
      if (result.status === 'saved') router.push(backHref)
      else setError(result.message)
    })
  }

  return (
    <form
      noValidate
      aria-label={group.bestBefore === null ? 'Datum nachtragen' : 'Datum ändern'}
      className="flex flex-col gap-4 pb-6 breit:max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <div className="mx-4 pt-4 breit:mx-6">
        <Field
          label={group.kind === 'use-by' ? 'Zu verbrauchen bis' : 'Mindestens haltbar bis'}
          name="mhd"
          autoComplete="off"
          placeholder="z. B. 09/2027"
          hint="Wie aufgedruckt: 30.09.2027, 09/2027 oder 2027."
          value={text}
          onChange={(event) => {
            setText(event.target.value)
          }}
          error={error}
        />
      </div>
      {total > 1 ? (
        <section aria-labelledby={countId}>
          <GroupHeader id={countId}>Für wie viele Packungen?</GroupHeader>
          <div className="mx-4 flex items-center justify-between rounded-group bg-surface px-4 py-2 breit:mx-6 breit:border breit:border-line">
            <span className="text-body">{`${String(count)} von ${String(total)}`}</span>
            <CountStepper
              label="neuem Datum"
              count={count}
              min={1}
              max={total}
              onChange={(delta) => {
                setCount((previous) => Math.min(total, Math.max(1, previous + delta)))
              }}
            />
          </div>
        </section>
      ) : null}
      {group.checkedCount > 0 ? (
        <p className="px-8 text-footnote text-fg2 breit:px-10">{STILL_GOOD_NOTE}</p>
      ) : null}
      <div className="mx-4 pt-4 breit:mx-6">
        <Button type="submit" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
