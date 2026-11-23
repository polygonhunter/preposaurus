// Zähler der Seitenleiste ab „breit“ (DESIGN_SYSTEM §6, #90): fällige Packungen wie auf „Bald fällig“
// und offene Einträge der Nachkaufen-Liste wie in der Wochenübersicht (#186). Gerechnet wird in den
// Use-Cases der Features, hier nur verdrahtet.
import 'server-only'
import { countDuePackages } from '@/features/inventory/application/count-due-packages'
import { stockServices } from '@/features/inventory/application/stock-services'
import { loadOpenRestockCount } from '@/features/restock/application/restock-services'

export interface NavCountsDto {
  due: number
  restock: number
}

export async function loadNavCounts(householdId: string): Promise<NavCountsDto> {
  const { reader, today } = await stockServices()
  const [due, restock] = await Promise.all([
    countDuePackages(reader, { householdId, today }),
    loadOpenRestockCount(householdId),
  ])
  return { due, restock }
}
