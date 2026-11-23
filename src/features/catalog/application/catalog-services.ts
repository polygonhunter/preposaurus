// Verdrahtung für Seiten und Actions: echte Repositories auf der Verbindung des Serverprozesses. Die
// Use-Cases bekommen ihre Ports übergeben und bleiben ohne DB testbar.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { createCategoryRepository, type CategoryRepository } from '../data/category-repository'
import { createFoodTypeRepository, type FoodTypeRepository } from '../data/food-type-repository'
import {
  createStorageLocationRepository,
  type StorageLocationRepository,
} from '../data/storage-location-repository'

export type CatalogServices = Readonly<{
  storageLocations: StorageLocationRepository
  categories: CategoryRepository
  foodTypes: FoodTypeRepository
}>

export async function catalogServices(): Promise<CatalogServices> {
  const db = await getDb()
  return {
    storageLocations: createStorageLocationRepository(db),
    categories: createCategoryRepository(db),
    foodTypes: createFoodTypeRepository(db),
  }
}
