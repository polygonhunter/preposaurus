import type { Metadata } from 'next'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StandalonePage } from '@/shared/ui/StandalonePage'

export const metadata: Metadata = { title: 'Nicht gefunden · Preposaurus' }

// Adresse, die es nicht gibt (#215). Statt der englischen Standardseite eine ruhige deutsche Seite
// mit einem Weg zurück. Unter /vorrat und /einstellungen gibt es eigene Seiten im App-Rahmen.
export default function NotFound() {
  return (
    <StandalonePage>
      <PageHeader title="Nicht gefunden" />
      <EmptyState
        text="Diese Seite gibt es nicht."
        action={{ href: '/uebersicht', label: 'Zur Übersicht' }}
      />
    </StandalonePage>
  )
}
