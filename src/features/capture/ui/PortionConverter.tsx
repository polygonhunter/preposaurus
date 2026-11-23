import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { formatGermanNumber, parseGermanNumber } from '@/shared/lib/quantities'
import { toPer100 } from '../domain/nutrition'
import type { NutritionField } from './manual-capture-draft'

type PortionConverterProps = Readonly<{
  values: Readonly<Record<NutritionField, string>>
  onConverted: (values: Record<NutritionField, string>) => void
}>

function convert(text: string, portionSize: number): string {
  const value = parseGermanNumber(text)
  if (value === null) return ''
  const per100 = toPer100({ value, basis: 'portion', portionSize })
  return per100.ok ? formatGermanNumber(per100.value) : ''
}

// Tabelle nur je Portion (#63): Die App fragt nach der Portionsgröße und rechnet auf 100 um.
export function PortionConverter({ values, onConverted }: PortionConverterProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()

  function apply() {
    const size = parseGermanNumber(text.replace(/\s*(g|ml)$/i, ''))
    if (size === null || size <= 0) {
      setError('Bitte die Portionsgröße als Zahl angeben, z. B. 30.')
      return
    }
    onConverted({
      kcal: convert(values.kcal, size),
      protein: convert(values.protein, size),
      carbs: convert(values.carbs, size),
      fat: convert(values.fat, size),
    })
  }

  return (
    <div className="mx-4 flex flex-col gap-3 pt-3 breit:mx-6">
      <Field
        label="Portionsgröße in g bzw. ml"
        name="portion"
        inputMode="decimal"
        autoComplete="off"
        hint="Die Tabelle nennt nur Werte je Portion. Die App rechnet auf 100 um."
        value={text}
        onChange={(event) => {
          setText(event.target.value)
        }}
        error={error}
      />
      <span>
        <Button variant="tinted" onClick={apply}>
          Auf 100 umrechnen
        </Button>
      </span>
    </div>
  )
}
