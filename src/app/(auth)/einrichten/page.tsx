import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { isSetUp } from '@/features/auth/application/setup-request'
import { SetupForm } from '@/features/auth/ui/SetupForm'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Einrichten · Preposaurus' }

// Nur erreichbar, solange es keinen Nutzer gibt (#34). Danach führt die Adresse zur Anmeldung.
// Die Action prüft das noch einmal in ihrer Transaktion.
export default async function SetupPage() {
  // Erst zur Anfragezeit prüfen, sonst friert der Build die Antwort ein.
  await connection()
  if (await isSetUp()) redirect('/anmelden')
  return (
    <>
      <PageHeader
        title="Willkommen"
        subtitle="Hier behaltet ihr euren Notvorrat im Blick. Zuerst legt ihr das Konto an, mit dem ihr Preposaurus verwaltet."
      />
      <SetupForm />
    </>
  )
}
