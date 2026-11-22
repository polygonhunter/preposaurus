import Link from 'next/link'
import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Icon } from '@/shared/ui/Icon'
import { Row } from '@/shared/ui/Row'
import { StatusBadge } from '@/shared/ui/StatusBadge'

export function ListSection() {
  const dueId = useId()
  const placesId = useId()
  return (
    <>
      <GroupHeader
        id={dueId}
        trailing={
          <Link href="/vorrat" className="text-accent">
            Alle 18
          </Link>
        }
      >
        Bald fällig
      </GroupHeader>
      <Group labelledBy={dueId}>
        <Row
          title="Haferflocken"
          subtitle="2 Packungen · 1 kg"
          trailing={<StatusBadge tone="red" label="abgelaufen" />}
          action={{ href: '/vorrat' }}
        />
        <Row
          title="Kichererbsen"
          subtitle="4 Dosen · 1,6 kg"
          trailing={<StatusBadge tone="yellow" label="bald fällig" />}
          action={{ href: '/vorrat' }}
        />
        <Row title="Mineralwasser" subtitle="12 Flaschen · 18 l" trailing="31 Tage" />
      </Group>
      <GroupHeader id={placesId}>Lagerorte</GroupHeader>
      <Group labelledBy={placesId}>
        <Row icon={<Icon name="location" />} title="Keller" trailing="42" />
        <Row icon={<Icon name="location" />} title="Speisekammer" trailing="17" />
      </Group>
    </>
  )
}
