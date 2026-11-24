// Neu angelegte Lebensmittelarten (#142, #110) und Lagerorte (#301) stehen sofort in den
// Auswahllisten des Formulars, ohne Neuladen: Eingaben und Fotos bleiben, wie sie sind. Die Seite
// liefert sie beim nächsten Öffnen ohnehin vom Server mit, doppelte zählen nur einmal. Neue Arten
// stehen vorn, neue Orte hinten wie in ihrer gespeicherten Reihenfolge.
import { useState } from 'react'
import type { CaptureOptions, FoodTypeChoice, NamedChoice } from '../domain/capture-options'

function useAdded<T extends NamedChoice>(known: readonly T[]) {
  const [added, setAdded] = useState<readonly T[]>([])
  const knownIds = new Set(known.map((choice) => choice.id))
  const fresh = added.filter((choice) => !knownIds.has(choice.id))
  return {
    fresh,
    add: (choice: T) => {
      setAdded((previous) => [...previous, choice])
    },
  }
}

export function useAddedChoices(options: CaptureOptions) {
  const foodTypes = useAdded<FoodTypeChoice>(options.foodTypes)
  const locations = useAdded<NamedChoice>(options.storageLocations)
  const isUnchanged = foodTypes.fresh.length === 0 && locations.fresh.length === 0
  return {
    options: isUnchanged
      ? options
      : {
          ...options,
          foodTypes: [...foodTypes.fresh, ...options.foodTypes],
          storageLocations: [...options.storageLocations, ...locations.fresh],
        },
    addFoodType: foodTypes.add,
    addStorageLocation: locations.add,
  }
}
