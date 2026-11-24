// Neue Lebensmittelart direkt aus der Erfassung (#142, #110): „+ Neue Lebensmittelart“ und der
// bestätigte Vorschlag der Erkennung. Angelegt wird über denselben Use-Case wie in den Einstellungen
// (eigene Art `eigen_<slug>`, #126/#243), nur im Haushalt der Sitzung. Vorher prüft die App ähnliche
// Namen gegen die sichtbaren Arten samt Suchwörtern: Gibt es die Art schon, kommt sie zurück statt
// einer Dublette. Das Recht (nur Admin) prüft die Action.
import 'server-only'
import {
  catalogServices,
  type CatalogServices,
} from '@/features/catalog/application/catalog-services'
import { saveFoodType, type FoodTypeError } from '@/features/catalog/application/food-types'
import { getDb } from '@/server/db/get-db'
import { err, ok, type Result } from '@/shared/lib/result'
import { createCaptureOptionsRepository } from '../data/capture-options-repository'
import type { FoodTypeChoice } from '../domain/capture-options'
import { findSimilarFoodType } from '../domain/similar-food-type'
import type { CaptureOptionsReader } from './get-capture-options'

export type AddFoodTypeError = FoodTypeError | { kind: 'similar'; foodType: FoodTypeChoice }

interface AddFoodTypeDeps {
  catalog: Pick<CatalogServices, 'categories' | 'foodTypes'>
  options: Pick<CaptureOptionsReader, 'loadFoodTypes'>
}

interface AddFoodTypeCommand {
  householdId: string
  name: string
  categoryId: string
}

/** Richtwerte und Suchwörter ergänzt der Admin später in den Einstellungen. */
const NO_EXTRAS = {
  searchTerms: [],
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  typicalShelfLifeMonths: null,
}

async function addFoodType(
  deps: AddFoodTypeDeps,
  { householdId, name, categoryId }: AddFoodTypeCommand,
): Promise<Result<FoodTypeChoice, AddFoodTypeError>> {
  const similar = findSimilarFoodType(await deps.options.loadFoodTypes(householdId), name)
  if (similar !== null) return err({ kind: 'similar', foodType: similar })
  const saved = await saveFoodType(deps.catalog, {
    householdId,
    id: null,
    input: { name, categoryId, ...NO_EXTRAS },
  })
  if (!saved.ok) return saved
  const choices = await deps.options.loadFoodTypes(householdId)
  const created = choices.find((choice) => choice.id === saved.value.id)
  // Gerade angelegt und sichtbar: Fehlt sie, hat sie jemand gleichzeitig gelöscht.
  return created === undefined ? err({ kind: 'not-found' }) : ok(created)
}

export async function addFoodTypeForHousehold(command: AddFoodTypeCommand) {
  const options = createCaptureOptionsRepository(await getDb())
  return addFoodType({ catalog: await catalogServices(), options }, command)
}
