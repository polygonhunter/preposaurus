'use client'
import { Field } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'
import { Segmented } from '@/shared/ui/Segmented'
import type { MemberFormState } from '../actions/save-member-action'
import { ACTIVITY_LABELS, CONDITION_LABELS, SEX_LABELS, optionsOf } from './member-labels'
import type { MemberFormValues } from './member-form-values'

type MemberMoreFieldsProps = Readonly<{
  values: MemberFormValues
  errors: MemberFormState['errors']
}>

const NO_ANSWER = { value: '', label: 'Keine Angabe' }

// Freiwillige Angaben aus HH-02 und Allergien (HH-04). Sie wirken erst im Rechenmodus
// „Individuell“ (später), deshalb eingeklappt. Bei einem Fehler darin ist der Bereich offen.
export function MemberMoreFields({ values, errors }: MemberMoreFieldsProps) {
  const hasError = errors.weightKg !== undefined || errors.allergies !== undefined
  return (
    <details open={hasError || undefined} className="group flex flex-col">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-body text-accent">
        Weitere Angaben (freiwillig)
        <Icon
          name="chevron"
          size={18}
          className="rotate-90 transition-transform group-open:-rotate-90"
        />
      </summary>
      <div className="flex flex-col gap-4 pt-2">
        <p className="px-4 text-footnote text-fg2">
          Preposaurus rechnet zurzeit mit den offiziellen Werten. Diese Angaben helfen später bei
          einer genaueren Rechnung.
        </p>
        <Segmented
          legend="Geschlecht"
          name="geschlecht"
          options={[NO_ANSWER, ...optionsOf(SEX_LABELS)]}
          defaultValue={values.sex}
          isLegendVisible
        />
        <Segmented
          legend="Aktivität"
          name="aktivitaet"
          options={[NO_ANSWER, ...optionsOf(ACTIVITY_LABELS)]}
          defaultValue={values.activityLevel}
          isLegendVisible
        />
        <Segmented
          legend="Schwanger oder stillend"
          name="zustand"
          options={[{ value: '', label: 'Nein' }, ...optionsOf(CONDITION_LABELS)]}
          defaultValue={values.condition}
          isLegendVisible
        />
        <Field
          label="Gewicht in kg"
          name="gewicht"
          inputMode="decimal"
          defaultValue={values.weightKg}
          error={errors.weightKg}
        />
        <Field
          label="Allergien und Unverträglichkeiten"
          name="allergien"
          defaultValue={values.allergies}
          hint="Mit Komma getrennt, z. B. Gluten, Erdnüsse."
          error={errors.allergies}
        />
      </div>
    </details>
  )
}
