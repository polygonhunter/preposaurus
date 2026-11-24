import { Field } from '@/shared/ui/Field'
import type { FoodTypeField } from '../actions/save-food-type-action'
import type { FoodTypeFormValues } from './food-type-form-values'

type NutritionField = Extract<
  FoodTypeField,
  'kcalPer100' | 'proteinPer100' | 'carbsPer100' | 'fatPer100'
>

type FoodTypeReferenceFieldsProps = Readonly<{
  values: FoodTypeFormValues
  errors: Partial<Record<FoodTypeField, string>>
}>

// Dieselben Bezeichnungen wie bei den Nährwerten beim Erfassen
const NUTRITION_FIELDS: readonly { field: NutritionField; label: string; name: string }[] = [
  { field: 'kcalPer100', label: 'Brennwert in kcal', name: 'kcal' },
  { field: 'proteinPer100', label: 'Eiweiß in g', name: 'eiweiss' },
  { field: 'carbsPer100', label: 'Kohlenhydrate in g', name: 'kohlenhydrate' },
  { field: 'fatPer100', label: 'Fett in g', name: 'fett' },
]

// Richtwerte einer eigenen Art (#243), wie sie die Arten der Startliste haben. Sie gelten nur für
// Produkte ohne eigene Nährwerte, stehen dort als „ca.“ und werden nie ins Produkt kopiert. Die
// übliche Haltbarkeit ist nur ein Hinweis im Vorrat, nie ein MHD.
export function FoodTypeReferenceFields({ values, errors }: FoodTypeReferenceFieldsProps) {
  return (
    <>
      <fieldset aria-describedby="richtwerte-hinweis" className="flex flex-col gap-4">
        <legend className="px-4 pb-1.5 text-footnote text-fg2">
          Richtwerte je 100 g oder ml (freiwillig)
        </legend>
        <p id="richtwerte-hinweis" className="-mt-2 px-4 text-footnote text-fg2">
          Sie gelten für Produkte ohne eigene Nährwerte und stehen dann als „ca.“ da.
        </p>
        {NUTRITION_FIELDS.map(({ field, label, name }) => (
          <Field
            key={field}
            label={label}
            name={name}
            inputMode="decimal"
            autoComplete="off"
            defaultValue={values[field]}
            error={errors[field]}
          />
        ))}
      </fieldset>
      <Field
        label="Übliche Haltbarkeit in Monaten (freiwillig)"
        name="haltbarkeit"
        inputMode="numeric"
        autoComplete="off"
        defaultValue={values.typicalShelfLifeMonths}
        hint="Nur ein Hinweis im Vorrat, nie ein MHD."
        error={errors.typicalShelfLifeMonths}
      />
    </>
  )
}
