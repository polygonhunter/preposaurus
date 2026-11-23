'use client'
import { useActionState } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { RadioChips } from '@/shared/ui/RadioChips'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { entryFormIdle } from '../actions/entry-form-state'
import { saveCategoryAction, type CategoryFormState } from '../actions/save-category-action'
import type { ProductGroup } from '../domain/category'

type CategoryFormProps = Readonly<{
  groups: readonly ProductGroup[]
  /** Beim Ändern: die eigene Kategorie */
  category?: Readonly<{ id: string; name: string; productGroupId: string }>
}>

const INITIAL_STATE: CategoryFormState = entryFormIdle()

const valuesOf = (category: CategoryFormProps['category']) => ({
  name: category?.name ?? '',
  productGroupId: category?.productGroupId ?? '',
})

// Eigene Kategorie anlegen oder ändern (#76): Name und Warengruppe. Die Warengruppe bestimmt, in
// welche Rechnung die Produkte darin zählen, deshalb ist sie Pflicht. Neun Werte als Chip-Reihe
// statt Dropdown (DESIGN_SYSTEM §7).
export function CategoryForm({ groups, category }: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(saveCategoryAction, INITIAL_STATE)
  const formRef = useFocusFirstInvalid(state)
  const values = state.values ?? valuesOf(category)
  const { errors } = state
  return (
    <form ref={formRef} action={formAction} className="mx-4 flex flex-col gap-4 breit:mx-6">
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <Field
        label="Name der Kategorie"
        name="name"
        required
        maxLength={40}
        autoComplete="off"
        defaultValue={values.name}
        error={errors.name}
      />
      <RadioChips
        legend="Zählt zur Warengruppe"
        name="warengruppe"
        options={groups.map((group) => ({ value: group.id, label: group.name }))}
        defaultValue={values.productGroupId}
        error={errors.productGroupId}
      />
      <LiveMessage message={errors.name ?? errors.productGroupId} />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          {category ? 'Speichern' : 'Anlegen'}
        </Button>
      </div>
    </form>
  )
}
