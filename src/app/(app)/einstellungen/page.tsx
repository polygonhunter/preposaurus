import type { Metadata } from 'next'
import { EmptyState } from '@/shared/ui/EmptyState'

export const metadata: Metadata = { title: 'Einstellungen · Preposaurus' }

// Einstellungen (#37): Die Liste der Bereiche zeichnet das Layout, kompakt als ganze Seite. Ab
// „breit“ steht sie links, rechts bis zur Wahl dieser Hinweis (M12-06).
export default function SettingsPage() {
  return (
    <div className="hidden breit:block">
      <EmptyState text="Wählt links einen Bereich, er öffnet sich hier." />
    </div>
  )
}
