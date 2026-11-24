// Neu angelegte Lebensmittelarten (#142, #110) stehen sofort in den Auswahllisten des Formulars,
// ohne Neuladen: Eingaben und Fotos bleiben, wie sie sind. Die Seite liefert sie beim nächsten
// Öffnen ohnehin vom Server mit, doppelte zählen nur einmal.
import { useState } from 'react'
import type { CaptureOptions, FoodTypeChoice } from '../domain/capture-options'

export function useAddedFoodTypes(options: CaptureOptions) {
  const [added, setAdded] = useState<readonly FoodTypeChoice[]>([])
  const known = new Set(options.foodTypes.map((foodType) => foodType.id))
  const fresh = added.filter((foodType) => !known.has(foodType.id))
  const merged =
    fresh.length === 0 ? options : { ...options, foodTypes: [...fresh, ...options.foodTypes] }
  return {
    options: merged,
    add: (foodType: FoodTypeChoice) => {
      setAdded((previous) => [...previous, foodType])
    },
  }
}
