import { getDueUnits } from '@/features/inventory/application/get-due-units'
import { stockServices } from '@/features/inventory/application/stock-services'
import { ConsumeProvider } from '@/features/inventory/ui/ConsumeProvider'
import { DueList } from '@/features/inventory/ui/DueList'
import { DueSortSwitch } from '@/features/inventory/ui/DueSortSwitch'
import { STOCK_PATH, readDueSort } from '@/features/inventory/ui/stock-paths'
import { requirePageHousehold } from '@/server/auth/household'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

const BACK = { href: '/uebersicht', label: 'Übersicht' }

// Bald fällig (UX-Konzept §8.2, #125): eigene Adresse als Ziel für Push und Mail.
export default async function DuePage({ searchParams }: PageProps<'/uebersicht/bald-faellig'>) {
  const { householdId } = await requirePageHousehold()
  const sort = readDueSort(await searchParams)
  const { reader, today } = await stockServices()
  const due = await getDueUnits(reader, { householdId, today, sort })
  if (due.groups.length === 0) {
    return (
      <>
        <PageHeader title="Bald fällig" back={BACK} />
        <EmptyState
          text={`Nichts fällig in den nächsten ${String(due.thresholds.soonDays)} Tagen.`}
          action={{ href: STOCK_PATH, label: 'Zum Vorrat' }}
        />
      </>
    )
  }
  return (
    <ConsumeProvider>
      <PageHeader title="Bald fällig" back={BACK} />
      <DueSortSwitch sort={sort} />
      <DueList due={due} />
    </ConsumeProvider>
  )
}
