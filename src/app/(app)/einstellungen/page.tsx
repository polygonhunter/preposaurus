import { redirect } from 'next/navigation'
import { SignOutButton } from '@/features/auth/ui/SignOutButton'
import { requireUser } from '@/server/auth/guards'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export default async function SettingsPage() {
  const result = await requireUser()
  if (!result.ok) redirect('/anmelden')
  return (
    <>
      <PageHeader title="Einstellungen" back={{ href: '/uebersicht', label: 'Übersicht' }} />
      <EmptyState text="Hier stellt ihr bald Haushalt, Ziel und Konto ein." />
      <GroupHeader id="konto">Konto und Gerät</GroupHeader>
      <Group labelledBy="konto">
        <Row title="Angemeldet als" trailing={result.value.username} />
      </Group>
      <div className="pt-4">
        <SignOutButton />
      </div>
    </>
  )
}
