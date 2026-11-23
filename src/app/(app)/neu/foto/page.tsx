import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { findOpenDraft } from '@/features/capture/application/find-open-draft'
import { getCaptureOptionsForUser } from '@/features/capture/application/stock-request'
import { CaptureModeSwitch } from '@/features/capture/ui/CaptureModeSwitch'
import { NoHouseholdPage } from '@/features/capture/ui/NoHouseholdPage'
import { PhotoCapture } from '@/features/capture/ui/PhotoCapture'
import { initialPhotoCapture } from '@/features/capture/ui/photo-capture-state'
import { fromDraft } from '@/features/capture/ui/photo-draft-data'
import { requireHouseholdUser } from '@/server/auth/guards'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Erfassen per Foto · Preposaurus' }

// Foto-Erfassung (#61 bis #66, UX §8.5): Kamera, dann Prüfen und Speichern. Ein offener Entwurf
// wird hier ohne Rückfrage fortgesetzt, die Frage stellt „Neu“ (/neu) vorher.
export default async function PhotoCapturePage() {
  const user = await requireHouseholdUser()
  if (!user.ok) {
    if (user.error.kind === 'unauthenticated') redirect('/anmelden')
    return <NoHouseholdPage />
  }
  const actor = { householdId: user.value.householdId, userId: user.value.id }
  const [options, draft] = await Promise.all([
    getCaptureOptionsForUser(actor),
    loadCaptureDeps().then((deps) => findOpenDraft(deps, actor)),
  ])
  const initial =
    draft === null
      ? initialPhotoCapture(options.lastStorageLocationId)
      : fromDraft({ ...draft, containers: options.containers })
  return (
    <>
      <PageHeader title="Erfassen" />
      <CaptureModeSwitch current="foto" />
      <PhotoCapture options={options} initial={initial} />
    </>
  )
}
