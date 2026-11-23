import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { hideCategoryAction } from '../actions/hide-category-action'
import { removeCategoryAction } from '../actions/remove-category-action'
import { canRemoveCategory, type CategoryEntry, type ProductGroup } from '../domain/category'
import { CategoryForm } from './CategoryForm'
import { HideToggleForm } from './HideToggleForm'
import { RemoveEntryButton } from './RemoveEntryButton'

type CategoryEditSectionProps = Readonly<{
  category: CategoryEntry
  groups: readonly ProductGroup[]
}>

const HIDE_HINT =
  'Ausgeblendet stehen ihre Lebensmittelarten beim Erfassen und für die Foto-Erkennung nicht mehr zur Wahl. Produkte darin bleiben sichtbar und zählen weiter.'

// Was der Admin an einer Kategorie ändern kann (#76): eigene umbenennen und umhängen, jede je
// Haushalt ausblenden, eigene ohne Arten und Produkte löschen.
export function CategoryEditSection({ category, groups }: CategoryEditSectionProps) {
  return (
    <>
      {category.isSystem ? null : (
        <>
          <GroupHeader id="kategorie-bearbeiten">Name und Warengruppe</GroupHeader>
          <CategoryForm groups={groups} category={category} />
        </>
      )}
      <GroupHeader id="kategorie-sichtbarkeit">
        {category.isHidden ? 'Ausgeblendet' : 'Sichtbar'}
      </GroupHeader>
      {category.isRetired ? null : (
        <HideToggleForm id={category.id} isHidden={category.isHidden} action={hideCategoryAction} />
      )}
      <GroupFooter>
        {category.isRetired
          ? 'Diese Kategorie ist nicht mehr in der Startliste und bleibt ausgeblendet.'
          : HIDE_HINT}
      </GroupFooter>
      {canRemoveCategory(category) ? (
        <div className="pt-6">
          <RemoveEntryButton
            id={category.id}
            name={category.name}
            action={removeCategoryAction}
            label="Kategorie löschen"
          />
        </div>
      ) : null}
    </>
  )
}
