import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Statistik" />
      <EmptyState text="Hier seht ihr bald, wie sich euer Vorrat über die Zeit entwickelt." />
    </>
  )
}
