import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UnitDateForm } from '@/features/capture/ui/UnitDateForm'
import { unitDateEditor } from '@/features/inventory/application/edit-services'
import { getUnitDateGroup } from '@/features/inventory/application/get-unit-date-group'
import type { UnitDateGroup } from '@/features/inventory/schemas'
import { requirePageHousehold } from '@/server/auth/household'
import { detailPath } from '@/shared/config/stock-paths'
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Datum ändern · Preposaurus' }

function currentDate(bestBefore: UnitDateGroup['bestBefore']) {
  if (bestBefore === null) return 'Datum fehlt'
  return formatDayWithPrecision({ ...bestBefore, date: toCalendarDay(bestBefore.date) })
}

// Datum ändern bzw. nachtragen für die Datumszeile einer Packung (#49, #116). Eine fremde, kaputte
// oder schon entnommene Packung ergibt „nicht gefunden“.
export default async function UnitDatePage({ params }: PageProps<'/vorrat/packung/[id]/datum'>) {
  const { householdId } = await requirePageHousehold()
  const { id } = await params
  const result = await getUnitDateGroup(await unitDateEditor(), { householdId, unitId: id })
  if (!result.ok) notFound()
  const group = result.value
  const backHref = detailPath(group.target)
  const count = group.unitIds.length
  const packages = count === 1 ? '1 Packung' : `${String(count)} Packungen`
  return (
    <>
      <PageHeader
        title={group.bestBefore === null ? 'Datum nachtragen' : 'Datum ändern'}
        subtitle={`${group.productName} · ${currentDate(group.bestBefore)} · ${packages}`}
        back={{ href: backHref, label: group.name }}
      />
      <UnitDateForm group={group} backHref={backHref} />
    </>
  )
}
