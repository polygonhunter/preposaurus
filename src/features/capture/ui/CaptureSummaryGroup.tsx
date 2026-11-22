import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { CaptureSummary } from '../domain/capture-summary'

type CaptureSummaryGroupProps = Readonly<{
  summary: CaptureSummary
  storageLocationName: string | null
}>

// Kurze Zusammenfassung vor dem Speichern (#54): Packungen, Menge, kcal und Daten auf einen Blick.
// „Datum fehlt“ und „ca.“ (Richtwert) bleiben erkennbar.
export function CaptureSummaryGroup({ summary, storageLocationName }: CaptureSummaryGroupProps) {
  const headerId = useId()
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>Zusammenfassung</GroupHeader>
      <Group labelledBy={headerId}>
        <Row title={summary.headline} subtitle={summary.totals.join(' · ') || undefined} />
        <Row title="MHD" subtitle={summary.dates} />
        {storageLocationName === null ? null : (
          <Row title="Lagerort" trailing={storageLocationName} />
        )}
      </Group>
    </section>
  )
}
