import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { isPatternPageEnabled, loadEnv } from '@/shared/config/env'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PatternGallery } from './_sections/PatternGallery'

export const metadata: Metadata = { title: 'Musterseite · Preposaurus' }

// Zeigt alle Bausteine aus DESIGN_SYSTEM.md §5 hell und dunkel nebeneinander. Nur im Dev-Modus.
export default async function PatternPage() {
  // Erst zur Anfragezeit entscheiden, sonst friert der Build die Antwort ein.
  await connection()
  if (!isPatternPageEnabled(loadEnv())) notFound()
  return (
    <main className="pb-12">
      <PageHeader
        title="Musterseite"
        subtitle="Alle Bausteine aus DESIGN_SYSTEM.md, hell und dunkel."
      />
      <div className="mt-4 grid grid-cols-1 breit:grid-cols-2">
        <section aria-label="Hell" className="bg-bg pb-8 text-fg scheme-light">
          <PatternGallery />
        </section>
        <section aria-label="Dunkel" className="bg-bg pb-8 text-fg scheme-dark">
          <PatternGallery />
        </section>
      </div>
    </main>
  )
}
