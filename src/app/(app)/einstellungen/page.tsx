import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Einstellungen" back={{ href: '/uebersicht', label: 'Übersicht' }} />
      <EmptyState text="Hier stellt ihr bald Haushalt, Ziel und Konto ein." />
    </>
  )
}
