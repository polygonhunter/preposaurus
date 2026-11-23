import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCaptureOptionsForUser } from '@/features/capture/application/stock-request'
import { CaptureModeSwitch } from '@/features/capture/ui/CaptureModeSwitch'
import { ManualCapture } from '@/features/capture/ui/ManualCapture'
import { NoHouseholdPage } from '@/features/capture/ui/NoHouseholdPage'
import { requireHouseholdUser } from '@/server/auth/guards'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Erfassen · Preposaurus' }

const FIRST_START =
  'Euer Vorrat ist noch leer. Fangt mit etwas an, das ihr sicher im Schrank habt, zum Beispiel Nudeln oder Wasser.'

// Manuelles Erfassen (#52, UX §8.5): ein Formular auf einer Seite. Die Auswahllisten kommen aus dem
// Haushalt der Sitzung, Speichern prüft die Action selbst noch einmal.
export default async function ManualCapturePage() {
  const user = await requireHouseholdUser()
  if (!user.ok) {
    if (user.error.kind === 'unauthenticated') redirect('/anmelden')
    return <NoHouseholdPage />
  }
  const options = await getCaptureOptionsForUser({
    householdId: user.value.householdId,
    userId: user.value.id,
  })
  return (
    <>
      {options.isStockEmpty ? (
        <PageHeader title="Erfassen" subtitle={FIRST_START} />
      ) : (
        <PageHeader title="Erfassen" />
      )}
      <CaptureModeSwitch current="manuell" />
      <ManualCapture options={options} />
    </>
  )
}
