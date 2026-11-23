import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadRestockList } from '@/features/restock/application/restock-services'
import { RestockView } from '@/features/restock/ui/RestockView'
import { openCountText } from '@/features/restock/ui/restock-text'
import { requireHouseholdUser } from '@/server/auth/guards'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Nachkaufen · Preposaurus' }

// Nachkaufen (UX-Konzept §8.6, #73): „Was nehme ich beim Einkauf mit?“ Gerechnet wird im Use-Case,
// die Seite holt nur den Haushalt der Sitzung. Alle im Haushalt sehen dieselbe Liste.
export default async function RestockPage() {
  const access = await requireHouseholdUser()
  if (!access.ok) redirect('/anmelden')
  const list = await loadRestockList(access.value.householdId)
  return (
    <>
      <PageHeader title="Nachkaufen" subtitle={openCountText(list)} />
      <RestockView list={list} />
    </>
  )
}
