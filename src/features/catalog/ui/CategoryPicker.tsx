'use client'
import { useId, useState } from 'react'
import { cx } from '@/shared/lib/class-names'
import { normalizeSearchText } from '@/shared/lib/search-text'
import { Button } from '@/shared/ui/Button'
import { SearchField } from '@/shared/ui/SearchField'
import { Sheet } from '@/shared/ui/Sheet'

export interface CategoryChoice {
  id: string
  name: string
  productGroupName: string
}

type CategoryPickerProps = Readonly<{
  categories: readonly CategoryChoice[]
  defaultId: string
  error?: string | undefined
}>

const pathOf = (category: CategoryChoice) => `${category.productGroupName} › ${category.name}`

const matches = (category: CategoryChoice, query: string) =>
  normalizeSearchText(pathOf(category)).includes(normalizeSearchText(query))

// Kategorie wählen ohne Dropdown (#126, DESIGN_SYSTEM §7): Ein Knopf zeigt die Wahl, ein Blatt mit
// Suche listet die Kategorien samt Warengruppe. Die Wahl geht als verstecktes Feld ins Formular.
export function CategoryPicker({ categories, defaultId, error }: CategoryPickerProps) {
  const [selectedId, setSelectedId] = useState(defaultId)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const labelId = useId()
  const errorId = `${labelId}-fehler`
  const selected = categories.find((category) => category.id === selectedId)
  const hits = categories.filter((category) => matches(category, query))
  const close = () => {
    setIsOpen(false)
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="px-4 text-footnote text-fg2">
        Kategorie
      </span>
      <input type="hidden" name="kategorie" value={selectedId} />
      <button
        type="button"
        aria-labelledby={`${labelId} ${labelId}-wert`}
        aria-describedby={error ? errorId : undefined}
        data-invalid={error ? true : undefined}
        onClick={() => {
          setIsOpen(true)
        }}
        className={cx(
          'min-h-11 w-full rounded-field border bg-surface px-4 text-left text-body',
          error ? 'border-red' : 'border-line-strong',
          selected ? 'text-fg' : 'text-fg2',
        )}
      >
        <span id={`${labelId}-wert`}>{selected ? pathOf(selected) : 'Kategorie wählen'}</span>
      </button>
      {error ? (
        <p id={errorId} className="px-4 text-footnote text-red">
          {error}
        </p>
      ) : null}
      <Sheet isOpen={isOpen} onClose={close} title="Kategorie wählen">
        <div className="flex flex-col gap-2">
          <SearchField
            label="Kategorie suchen"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            onKeyDown={(event) => {
              // Enter sucht nur, das Formular dahinter wird nicht abgeschickt
              if (event.key === 'Enter') event.preventDefault()
            }}
          />
          <ul aria-label="Kategorien" className="max-h-[50dvh] overflow-y-auto">
            {hits.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  aria-pressed={category.id === selectedId}
                  onClick={() => {
                    setSelectedId(category.id)
                    close()
                  }}
                  className="flex min-h-11 w-full flex-col justify-center py-1.5 text-left aria-pressed:text-accent"
                >
                  <span className="text-body">{category.name}</span>
                  <span className="text-footnote text-fg2">{category.productGroupName}</span>
                </button>
              </li>
            ))}
          </ul>
          {hits.length === 0 ? (
            <p className="text-footnote text-fg2">Keine Kategorie gefunden.</p>
          ) : null}
          <Button variant="plain" onClick={close}>
            Abbrechen
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
