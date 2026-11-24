'use client'
import { useId } from 'react'
import type { DateKind } from '@/features/inventory/domain/unit'
import { DATE_KIND_EXPLANATION, DateKindChoice } from './DateKindChoice'
import { kindChangeNote } from './unit-date-kind'

type UnitDateKindFieldProps = Readonly<{
  // Art der Datumszeile, wie sie gespeichert ist (gemischt gilt als Verbrauchsdatum)
  rowKind: DateKind
  kind: DateKind
  onChange: (kind: DateKind) => void
}>

// Umschalter beim „Datum ändern“ (#300) mit dem Erklärsatz. Weicht die Wahl von der Zeile ab, sagt
// ein Satz im Live-Bereich, was das heißt: Ohne Nachfrage, aber sichtbar, auch zurück zum MHD.
export function UnitDateKindField({ rowKind, kind, onChange }: UnitDateKindFieldProps) {
  const name = useId()
  return (
    <div className="mx-4 flex flex-col gap-2 breit:mx-6 breit:max-w-sm">
      <DateKindChoice
        legend="Datumsart"
        name={name}
        value={kind}
        onChange={onChange}
        isLegendVisible
      />
      <p className="px-4 text-footnote text-fg2">{DATE_KIND_EXPLANATION}</p>
      <p role="status" className="px-4 text-footnote font-semibold text-fg empty:hidden">
        {kindChangeNote(rowKind, kind)}
      </p>
    </div>
  )
}
