import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function RestockPage() {
  return (
    <>
      <PageHeader title="Nachkaufen" />
      <EmptyState text="Hier steht bald, was bis zu eurem Ziel noch fehlt." />
    </>
  )
}
