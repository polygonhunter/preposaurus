import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { unavailableMessage } from '@/features/capture/actions/ai-messages'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { findReplacedPhotoWayReason } from '@/features/capture/application/choose-capture-way'
import { getCaptureOptionsForUser } from '@/features/capture/application/stock-request'
import { resolvePrefill } from '@/features/capture/domain/capture-prefill'
import { readPrefillParams } from '@/features/capture/schemas/prefill'
import { CaptureHeader } from '@/features/capture/ui/CaptureHeader'
import { CaptureWayNote } from '@/features/capture/ui/CaptureWayNote'
import { ManualCapture } from '@/features/capture/ui/ManualCapture'
import { NoHouseholdPage } from '@/features/capture/ui/NoHouseholdPage'
import { requireHouseholdUser } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Erfassen · Preposaurus' }

const FIRST_START =
  'Euer Vorrat ist noch leer. Fangt mit etwas an, das ihr sicher im Schrank habt, zum Beispiel Nudeln oder Wasser.'

// Manuelles Erfassen (#52, UX §8.5): ein Formular auf einer Seite. Die Auswahllisten kommen aus dem
// Haushalt der Sitzung, Speichern prüft die Action selbst noch einmal. `?art=` bzw. `?produkt=`
// belegen vor (#195), geprüft gegen dieselben Auswahllisten. Hat „Neu“ wegen ausgeschalteter
// Erkennung hierher statt in die gewohnte Kamera geführt, sagt ein Satz warum (#79).
export default async function ManualCapturePage({ searchParams }: PageProps<'/neu/manuell'>) {
  const user = await requireHouseholdUser()
  if (!user.ok) {
    if (user.error.kind === 'unauthenticated') redirect('/anmelden')
    return <NoHouseholdPage />
  }
  const actor = { householdId: user.value.householdId, userId: user.value.id }
  const [options, replacedReason] = await Promise.all([
    getCaptureOptionsForUser({ ...actor, isAdmin: user.value.role === 'admin' }),
    findReplacedPhotoWayReason(await loadCaptureDeps(), actor),
  ])
  const prefill = resolvePrefill(options, readPrefillParams(await searchParams))
  return (
    <>
      {options.isStockEmpty ? (
        <CaptureHeader mode="manuell" subtitle={FIRST_START} />
      ) : (
        <CaptureHeader mode="manuell" />
      )}
      {replacedReason === null ? null : (
        <CaptureWayNote text={unavailableMessage(replacedReason)} />
      )}
      <ManualCapture options={options} prefill={prefill} />
    </>
  )
}
