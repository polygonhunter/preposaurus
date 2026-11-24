import { useId } from 'react'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { CountStepper } from './CountStepper'

type UnitDateCountSectionProps = Readonly<{
  count: number
  total: number
  onChange: (delta: number) => void
}>

// „Für wie viele Packungen?“ beim „Datum ändern“ (#49): eine Zeile mit „2 von 3“ und Stepper.
export function UnitDateCountSection({ count, total, onChange }: UnitDateCountSectionProps) {
  const headerId = useId()
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>Für wie viele Packungen?</GroupHeader>
      <div className="mx-4 flex items-center justify-between rounded-group bg-surface px-4 py-2 breit:mx-6 breit:border breit:border-line">
        <span className="text-body">{`${String(count)} von ${String(total)}`}</span>
        <CountStepper label="neuem Datum" count={count} min={1} max={total} onChange={onChange} />
      </div>
    </section>
  )
}
