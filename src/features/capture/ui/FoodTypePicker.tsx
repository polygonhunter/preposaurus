'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { Row } from '@/shared/ui/Row'
import { SearchField } from '@/shared/ui/SearchField'
import { foodTypePath, type FoodTypeChoice } from '../domain/capture-options'
import { searchFoodTypes } from '../domain/food-type-search'
import { FoodTypeResults } from './FoodTypeResults'

type FoodTypePickerProps = Readonly<{
  foodTypes: readonly FoodTypeChoice[]
  recentIds: readonly string[]
  selected: FoodTypeChoice | null
  onSelect: (foodTypeId: string | null) => void
  error: string | undefined
}>

const MAX_RESULTS = 8

function hitMessage(hits: readonly unknown[] | null): string | null {
  if (hits === null) return null
  if (hits.length === 0) return 'Keine Lebensmittelart gefunden.'
  return hits.length === 1 ? '1 Treffer' : `${String(hits.length)} Treffer`
}

// Lebensmittelart per Suche aus der Liste des Haushalts (UX §8.5). Kategorie und Warengruppe stehen
// nur als abgeleitete Pfadzeile da (#110). Das Suchfeld hat sofort den Fokus, wie im UX-Konzept.
export function FoodTypePicker(props: FoodTypePickerProps) {
  const { foodTypes, recentIds, selected, onSelect, error } = props
  const headerId = useId()
  const errorId = useId()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const isSearching = selected === null

  useEffect(() => {
    if (isSearching) searchRef.current?.focus()
  }, [isSearching])

  function choose(foodTypeId: string | null) {
    setQuery('')
    onSelect(foodTypeId)
  }

  const hits = query.trim() === '' ? null : searchFoodTypes(foodTypes, query, MAX_RESULTS)
  const recent = recentIds.flatMap((id) => foodTypes.filter((foodType) => foodType.id === id))
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>Lebensmittelart</GroupHeader>
      {selected === null ? (
        <div className="flex flex-col gap-1.5">
          <div className="mx-4 breit:mx-6">
            <SearchField
              ref={searchRef}
              label="Lebensmittelart suchen"
              name="lebensmittelart"
              placeholder="Suchen, z. B. Nudeln"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          {error ? (
            <p id={errorId} className="px-8 text-footnote text-red breit:px-10">
              {error}
            </p>
          ) : null}
          <FoodTypeResults hits={hits} recent={recent} onChoose={choose} />
        </div>
      ) : (
        <Group labelledBy={headerId}>
          <Row
            title={selected.name}
            subtitle={foodTypePath(selected)}
            trailing={
              <Button
                variant="plain"
                aria-label="Lebensmittelart ändern"
                onClick={() => {
                  choose(null)
                }}
              >
                Ändern
              </Button>
            }
          />
        </Group>
      )}
      <LiveMessage message={hitMessage(hits)} />
    </section>
  )
}
