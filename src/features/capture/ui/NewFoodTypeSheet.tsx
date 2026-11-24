'use client'
import { Button } from '@/shared/ui/Button'
import { CategoryPicker } from '@/shared/ui/CategoryPicker'
import { Field } from '@/shared/ui/Field'
import { Sheet } from '@/shared/ui/Sheet'
import { foodTypePath, type CategoryChoice, type FoodTypeChoice } from '../domain/capture-options'
import { useNewFoodType, type AddFoodTypeProblem, type NewFoodTypeDraft } from './use-new-food-type'

type NewFoodTypeSheetProps = Readonly<{
  foodTypes: readonly FoodTypeChoice[]
  categories: readonly CategoryChoice[]
  initial: NewFoodTypeDraft
  initialProblem?: AddFoodTypeProblem | null
  onClose: () => void
  /** Neu angelegt oder vorhanden gewählt: Das Formular wählt die Art */
  onChosen: (foodType: FoodTypeChoice) => void
}>

// Neue Lebensmittelart direkt aus der Erfassung (#142, #110), ohne das Formular zu verlassen. Kein
// eigenes <form>, weil das Blatt im Erfassen-Formular liegt: Enter im Namen legt an, statt das
// Erfassen abzuschicken. Gibt es die Art schon (Name oder Suchwort), steht sie zur Wahl.
export function NewFoodTypeSheet(props: NewFoodTypeSheetProps) {
  const { foodTypes, categories, initial, initialProblem, onClose, onChosen } = props
  const form = useNewFoodType({ foodTypes, initial, initialProblem, onAdded: onChosen })
  const { draft, similar, problem } = form
  return (
    <Sheet
      isOpen
      onClose={onClose}
      title="Neue Lebensmittelart"
      actions={
        <>
          {similar === null ? (
            <Button onClick={form.create} pendingLabel={form.isPending ? 'Legt an …' : undefined}>
              Anlegen
            </Button>
          ) : (
            <Button
              onClick={() => {
                onChosen(similar)
              }}
            >
              {`„${similar.name}“ wählen`}
            </Button>
          )}
          <Button variant="plain" onClick={onClose}>
            Abbrechen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Name der Lebensmittelart"
          name="neue-lebensmittelart"
          maxLength={40}
          autoComplete="off"
          value={draft.name}
          hint="Allgemein, ohne Marke, z. B. „Dinkelreis“"
          onChange={(event) => {
            form.change({ name: event.target.value })
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            form.create()
          }}
          error={problem?.errors.name}
        />
        <CategoryPicker
          categories={categories}
          defaultId={draft.categoryId}
          onChange={(categoryId) => {
            form.change({ categoryId })
          }}
          error={problem?.errors.categoryId}
        />
        {similar === null ? null : (
          <p role="status" className="px-4 text-footnote text-fg2">
            {`Das gibt es schon: „${similar.name}“ (${foodTypePath(similar)}).`}
          </p>
        )}
        {problem?.message ? (
          <p role="alert" className="px-4 text-footnote text-red">
            {problem.message}
          </p>
        ) : null}
      </div>
    </Sheet>
  )
}
