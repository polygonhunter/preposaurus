import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { chooseCaptureWay } from '@/features/capture/application/choose-capture-way'
import { findOpenDraft } from '@/features/capture/application/find-open-draft'
import { CaptureHeader } from '@/features/capture/ui/CaptureHeader'
import { draftAgeLabel } from '@/features/capture/ui/draft-age-label'
import { DraftResumePrompt } from '@/features/capture/ui/DraftResumePrompt'
import { NoHouseholdPage } from '@/features/capture/ui/NoHouseholdPage'
import { requireHouseholdUser } from '@/server/auth/guards'

export const metadata: Metadata = { title: 'Erfassen · Preposaurus' }

// Der Erfassen-Knopf (UX §8.5): Ist ein Entwurf offen, fragt die App zuerst „Fortsetzen oder
// verwerfen?“. Sonst öffnet sie den zuletzt genutzten Weg (chooseCaptureWay).
export default async function CapturePage() {
  const user = await requireHouseholdUser()
  if (!user.ok) {
    if (user.error.kind === 'unauthenticated') redirect('/anmelden')
    return <NoHouseholdPage />
  }
  const actor = { householdId: user.value.householdId, userId: user.value.id }
  const deps = await loadCaptureDeps()
  const draft = await findOpenDraft(deps, actor)
  if (draft === null) {
    redirect((await chooseCaptureWay(deps, actor)) === 'photo' ? '/neu/foto' : '/neu/manuell')
  }
  return (
    <>
      <CaptureHeader />
      <DraftResumePrompt
        draftId={draft.draftId}
        ageLabel={draftAgeLabel(draft.updatedAt, new Date())}
        photoCount={draft.photos.length}
      />
    </>
  )
}
