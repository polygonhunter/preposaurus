import { EmptyState } from '@/shared/ui/EmptyState'
import { CaptureHeader } from './CaptureHeader'

// Erfassen ohne Haushalt: ein ruhiger Satz statt Formular oder Kamera.
export function NoHouseholdPage() {
  return (
    <>
      <CaptureHeader />
      <EmptyState text="Dein Konto gehört noch zu keinem Haushalt. Ein Admin kann das ändern." />
    </>
  )
}
