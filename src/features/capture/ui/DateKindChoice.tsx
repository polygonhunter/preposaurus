'use client'
import type { DateKind } from '@/features/inventory/domain/unit'
import { Segmented } from '@/shared/ui/Segmented'

type DateKindChoiceProps = Readonly<{
  // Je Datumseintrag eindeutig, z. B. „Datumsart für 03.12.2026“
  legend: string
  name: string
  value: DateKind
  onChange: (kind: DateKind) => void
  isLegendVisible?: boolean
}>

const OPTIONS = [
  { value: 'best-before', label: 'MHD' },
  { value: 'use-by', label: 'Verbrauchsdatum' },
] as const satisfies readonly { value: DateKind; label: string }[]

/** Ein Satz zum Unterschied, ruhig und ohne Angstmache (#294) */
export const DATE_KIND_EXPLANATION =
  'MHD: oft noch länger gut. Verbrauchsdatum: nach diesem Tag nicht mehr essen.'

const isDateKind = (value: string): value is DateKind =>
  OPTIONS.some((option) => option.value === value)

// Umschalter „MHD · Verbrauchsdatum“ (#294, #300): eine Radiogruppe, Standard MHD. Die Erkennung
// am Text oder die KI setzt ihn vor, der Nutzer entscheidet.
export function DateKindChoice({ onChange, ...props }: DateKindChoiceProps) {
  return (
    <Segmented
      {...props}
      options={OPTIONS}
      onChange={(value) => {
        if (isDateKind(value)) onChange(value)
      }}
    />
  )
}
