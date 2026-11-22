import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function CapturePage() {
  return (
    <>
      <PageHeader title="Erfassen" />
      <EmptyState text="Hier tragt ihr bald Neues ein, per Foto oder von Hand." />
    </>
  )
}
