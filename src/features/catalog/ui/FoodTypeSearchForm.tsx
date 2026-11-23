import { SearchField } from '@/shared/ui/SearchField'

type FoodTypeSearchFormProps = Readonly<{ query: string }>

// Suche als einfaches GET-Formular: Die Suche steht in der Adresse (?suche=…) und geht ohne
// JavaScript. Enter schickt sie ab.
export function FoodTypeSearchForm({ query }: FoodTypeSearchFormProps) {
  return (
    <form role="search" className="mx-4 pt-2 breit:mx-6">
      <SearchField
        label="Lebensmittelart suchen"
        name="suche"
        defaultValue={query}
        placeholder="Name, Kategorie oder Suchwort"
        enterKeyHint="search"
      />
    </form>
  )
}
