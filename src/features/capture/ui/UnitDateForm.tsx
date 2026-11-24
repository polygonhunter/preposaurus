'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { UnitDateGroup } from '@/features/inventory/schemas/detail'
import { todayInBerlin } from '@/shared/lib/dates'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { changeUnitDatesAction } from '../actions/change-unit-dates-action'
import { parseBestBefore } from '../domain/best-before'
import { PARSE_MESSAGES } from './best-before-messages'
import { kindAfterTyping } from './unit-date-kind'
import { UnitDateCountSection } from './UnitDateCountSection'
import { UnitDateKindField } from './UnitDateKindField'

type UnitDateFormProps = Readonly<{
  group: UnitDateGroup
  // Detailseite, zu der es nach dem Speichern zurückgeht
  backHref: string
}>

const EMPTY_MESSAGE = 'Bitte gebt das Datum ein, wie es aufgedruckt ist.'
const STILL_GOOD_NOTE = 'Mit einem neuen Datum gilt „Noch gut“ für diese Packungen nicht mehr.'
const HINT = 'Wie aufgedruckt: 30.09.2027, 09/2027 oder 2027, auch mit „zu verbrauchen bis“.'

// Datum ändern bzw. nachtragen (#49, #116): eine Eingabe wie beim Erfassen (Tag, Monat oder Jahr),
// für alle oder einige Packungen der Datumszeile. Es wird nie ein Datum vorgeschlagen. Der
// Umschalter MHD · Verbrauchsdatum startet mit der Art der Zeile (#300); auch zurück zum MHD,
// sichtbar per Satz, denn ein Verbrauchsdatum kann ein Versehen gewesen sein.
export function UnitDateForm({ group, backHref }: UnitDateFormProps) {
  const router = useRouter()
  const total = group.unitIds.length
  const [text, setText] = useState('')
  const [kind, setKind] = useState(group.kind)
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
        kind,
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
          label={kind === 'use-by' ? 'Zu verbrauchen bis' : 'Mindestens haltbar bis'}
          name="mhd"
          autoComplete="off"
          placeholder="z. B. 09/2027"
          hint={HINT}
          value={text}
          onChange={(event) => {
            const nextText = event.target.value
            setKind(kindAfterTyping({ previousText: text, nextText, kind }))
            setText(nextText)
          }}
          error={error}
        />
      </div>
      <UnitDateKindField rowKind={group.kind} kind={kind} onChange={setKind} />
      {total > 1 ? (
        <UnitDateCountSection
          count={count}
          total={total}
          onChange={(delta) => {
            setCount((previous) => Math.min(total, Math.max(1, previous + delta)))
          }}
        />
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
