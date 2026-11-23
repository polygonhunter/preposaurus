import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

// Erfassen ohne Haushalt: ein ruhiger Satz statt Formular oder Kamera.
export function NoHouseholdPage() {
  return (
    <>
      <PageHeader title="Erfassen" />
      <EmptyState text="Dein Konto gehört noch zu keinem Haushalt. Ein Admin kann das ändern." />
    </>
  )
}
