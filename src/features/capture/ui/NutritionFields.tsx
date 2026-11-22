import { Field } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'
import { formatGermanNumber, type ContentUnit } from '@/shared/lib/quantities'
import type { FoodTypeChoice } from '../domain/capture-options'
import type { CaptureErrors, NutritionField } from './manual-capture-draft'

type NutritionFieldsProps = Readonly<{
  values: Readonly<Record<NutritionField, string>>
  onChange: (field: NutritionField, value: string) => void
  errors: CaptureErrors
  foodType: FoodTypeChoice | null
  unit: ContentUnit
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
}>

const FIELDS: readonly { field: NutritionField; label: string; name: string }[] = [
  { field: 'kcal', label: 'Brennwert in kcal', name: 'kcal' },
  { field: 'protein', label: 'Eiweiß in g', name: 'eiweiss' },
  { field: 'carbs', label: 'Kohlenhydrate in g', name: 'kohlenhydrate' },
  { field: 'fat', label: 'Fett in g', name: 'fett' },
]

function referenceText(foodType: FoodTypeChoice | null, unit: ContentUnit): string {
  if (foodType === null) return 'Ohne eigene Angaben rechnet die App mit dem Richtwert der Art.'
  if (foodType.kcalPer100 === null) {
    return `Für ${foodType.name} gibt es keinen Richtwert. Ohne Angaben zählen die kcal noch nicht mit.`
  }
  const kcal = formatGermanNumber(foodType.kcalPer100, 0)
  return `Ohne eigene Angaben gilt der Richtwert für ${foodType.name}: ca. ${kcal} kcal je 100 ${unit}, geschätzt.`
}

// Nährwerte je 100 g bzw. ml, freiwillig (UX §1). Ohne Werte gilt der Richtwert der Lebensmittelart,
// sichtbar als „ca.“ (UX §4). Eingetippte Werte gelten als eigene Angabe (`manual`).
export function NutritionFields(props: NutritionFieldsProps) {
  const { values, onChange, errors, foodType, unit, isOpen, onToggle } = props
  return (
    <details
      open={isOpen}
      onToggle={(event) => {
        onToggle(event.currentTarget.open)
      }}
      className="group mt-[22px]"
    >
      <summary className="mx-4 flex min-h-11 rounded-group bg-surface breit:mx-6 breit:border breit:border-line cursor-pointer list-none items-center justify-between gap-3 px-4 py-[11px] text-body [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block">Nährwerte je 100 {unit}</span>
          <span className="block text-footnote text-fg2">freiwillig, vom Etikett</span>
        </span>
        <Icon
          name="chevron"
          size={18}
          className="shrink-0 text-fg2 transition-transform duration-150 ease-out group-open:rotate-90"
        />
      </summary>
      <div className="mx-4 flex flex-col gap-4 pt-3 breit:mx-6">
        <p className="px-4 text-footnote text-fg2">{referenceText(foodType, unit)}</p>
        {FIELDS.map(({ field, label, name }) => (
          <Field
            key={field}
            label={label}
            name={name}
            inputMode="decimal"
            autoComplete="off"
            value={values[field]}
            onChange={(event) => {
              onChange(field, event.target.value)
            }}
            error={errors[field]}
          />
        ))}
      </div>
    </details>
  )
}
