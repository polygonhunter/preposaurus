'use client'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import type { CaptureOptions } from '../domain/capture-options'
import type { ProductEditDto } from '../domain/product-edit-records'
import { FoodTypePicker } from './FoodTypePicker'
import { NUTRITION_FIELDS } from './manual-capture-draft'
import { draftOfProduct, type EditField } from './product-edit-draft'
import { ProductEditFields } from './ProductEditFields'
import { useProductEdit } from './use-product-edit'

type ProductEditFormProps = Readonly<{
  product: ProductEditDto
  options: Pick<
    CaptureOptions,
    'foodTypes' | 'recentFoodTypeIds' | 'containers' | 'storageLocations'
  >
}>

/** name-Attribut des Eingabefelds je Feld, damit der Fokus beim Speichern dorthin springt */
const FIELD_INPUTS: Record<Exclude<EditField, 'form'>, string> = {
  name: 'bezeichnung',
  foodTypeId: 'lebensmittelart',
  content: 'inhalt',
  kcal: 'kcal',
  protein: 'eiweiss',
  carbs: 'kohlenhydrate',
  fat: 'fett',
}

const isNutritionField = (field: EditField) =>
  (NUTRITION_FIELDS as readonly string[]).includes(field)

// Angaben bearbeiten (#49, VOR-04): Lebensmittelart (Kategorie folgt, #110), Bezeichnung, Packung,
// Lagerort und Nährwerte, mit denselben Bausteinen wie beim Erfassen. Eine unbestätigte Schätzung
// lässt sich hier bestätigen, echte Werte entfernen „geschätzt“ (#115).
export function ProductEditForm({ product, options }: ProductEditFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isNutritionOpen, setNutritionOpen] = useState(true)

  function focusField(field: EditField) {
    if (field === 'form') return
    if (isNutritionField(field)) {
      flushSync(() => {
        setNutritionOpen(true)
      })
    }
    const input = formRef.current?.elements.namedItem(FIELD_INPUTS[field])
    if (input instanceof HTMLElement) input.focus()
  }

  const edit = useProductEdit(draftOfProduct(product), {
    foodTypes: options.foodTypes,
    onInvalid: focusField,
  })
  const { draft, errors } = edit
  const foodType = options.foodTypes.find((choice) => choice.id === draft.foodTypeId) ?? null
  return (
    <form
      ref={formRef}
      noValidate
      aria-label="Angaben bearbeiten"
      className="pb-6 breit:max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        edit.submit()
      }}
    >
      <FoodTypePicker
        foodTypes={options.foodTypes}
        recentIds={options.recentFoodTypeIds}
        selected={foodType}
        onSelect={edit.selectFoodType}
        error={errors.foodTypeId}
      />
      <ProductEditFields
        edit={edit}
        options={options}
        foodType={foodType}
        savedUnit={product.content.unit}
        canConfirmEstimate={product.isEstimateUnconfirmed}
        nutritionOpen={{ isOpen: isNutritionOpen, onToggle: setNutritionOpen }}
      />
      <LiveMessage message={Object.values(errors).find(Boolean) ?? null} />
      <div className="mx-4 flex flex-col gap-3 pt-8 breit:mx-6">
        {errors.form ? <p className="px-4 text-footnote text-red">{errors.form}</p> : null}
        <Button type="submit" pendingLabel={edit.isSaving ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
