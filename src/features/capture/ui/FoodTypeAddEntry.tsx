'use client'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import type { CategoryChoice, FoodTypeChoice } from '../domain/capture-options'
import { NewFoodTypeSheet } from './NewFoodTypeSheet'

/** Neue Arten anlegen beim Erfassen (#142, #110): Admin und Mitglied (#298). */
export interface FoodTypeAdding {
  categories: readonly CategoryChoice[]
  onAdded: (foodType: FoodTypeChoice) => void
}

type FoodTypeAddEntryProps = Readonly<{
  adding: FoodTypeAdding
  foodTypes: readonly FoodTypeChoice[]
  /** Eingabe im Suchfeld, wird zum Namen der neuen Art */
  query: string
  onChosen: (foodTypeId: string) => void
}>

// Unter den Treffern (UX §8.5): „+ Neue Lebensmittelart“, mit Suche „+ ‚Dinkelreis‘ als neue
// Lebensmittelart anlegen“. Das Blatt legt an, ohne das Formular zu verlassen.
export function FoodTypeAddEntry(props: FoodTypeAddEntryProps) {
  const { adding, foodTypes, query, onChosen } = props
  const [sheetName, setSheetName] = useState<string | null>(null)
  const name = query.trim()
  return (
    <div className="px-4 breit:px-6">
      {/* Lange Namen brechen um, statt die Seite seitlich rollen zu lassen */}
      <Button
        variant="plain"
        className="text-left whitespace-normal!"
        onClick={() => {
          setSheetName(name)
        }}
      >
        {name === '' ? '+ Neue Lebensmittelart' : `+ „${name}“ als neue Lebensmittelart anlegen`}
      </Button>
      {sheetName === null ? null : (
        <NewFoodTypeSheet
          foodTypes={foodTypes}
          categories={adding.categories}
          initial={{ name: sheetName, categoryId: '' }}
          onClose={() => {
            setSheetName(null)
          }}
          onChosen={(foodType) => {
            // Erst das modale Blatt schließen: Solange es offen ist, kann der Fokus nicht ins
            // Formular (nach der Wahl geht es mit dem Inhalt weiter).
            flushSync(() => {
              setSheetName(null)
            })
            adding.onAdded(foodType)
            onChosen(foodType.id)
          }}
        />
      )}
    </div>
  )
}
