import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { unavailableMessage } from '@/features/capture/actions/ai-messages'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { findRecognitionOffReason } from '@/features/capture/application/choose-capture-way'
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
// wird hier ohne Rückfrage fortgesetzt, die Frage stellt „Neu“ (/neu) vorher. Ist die Erkennung
// aus, steht das schon in der Kamera und nach dem Fortsetzen derselbe Satz (#210).
export default async function PhotoCapturePage() {
  const user = await requireHouseholdUser()
  if (!user.ok) {
    if (user.error.kind === 'unauthenticated') redirect('/anmelden')
    return <NoHouseholdPage />
  }
  const actor = { householdId: user.value.householdId, userId: user.value.id }
  const deps = await loadCaptureDeps()
  const [options, draft, offReason] = await Promise.all([
    getCaptureOptionsForUser(actor),
    findOpenDraft(deps, actor),
    findRecognitionOffReason(deps, actor),
  ])
  const recognitionOff = offReason === null ? null : unavailableMessage(offReason)
  const initial =
    draft === null
      ? initialPhotoCapture(options.lastStorageLocationId)
      : fromDraft({ ...draft, containers: options.containers, recognitionOff })
  return (
    <>
      <PageHeader title="Erfassen" />
      <CaptureModeSwitch current="foto" />
      <PhotoCapture options={options} initial={initial} recognitionOff={recognitionOff} />
    </>
  )
}
