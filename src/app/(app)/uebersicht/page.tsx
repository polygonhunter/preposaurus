import { EmptyState } from '@/shared/ui/EmptyState'
import { IconLink } from '@/shared/ui/IconLink'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Übersicht"
        action={<IconLink href="/einstellungen" icon="gear" label="Einstellungen" />}
      />
      <EmptyState
        text="Hier seht ihr bald, wie viele Tage euer Vorrat reicht und was als Nächstes dran ist."
        action={{ href: '/neu', label: 'Erstes Produkt erfassen' }}
      />
    </>
  )
}
