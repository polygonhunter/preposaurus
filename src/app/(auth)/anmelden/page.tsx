import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { isSetUp } from '@/features/auth/application/setup-request'
import { safeReturnPath } from '@/features/auth/domain/return-path'
import { SignInForm } from '@/features/auth/ui/SignInForm'
import { requireUser } from '@/server/auth/guards'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Anmelden · Preposaurus' }

// Eigener Typ statt PageProps<'/anmelden'>: PageProps entsteht erst mit `next typegen`, und der
// Lint-Job der CI läuft ohne.
type SignInPageProps = Readonly<{
  searchParams: Promise<Readonly<{ weiter?: string | string[] | undefined }>>
}>

// Ohne Nutzer gibt es niemanden zum Anmelden: dann die Einrichtung (ONBOARDING §2.1).
// Wer schon angemeldet ist, landet gleich auf der gewünschten Seite.
export default async function SignInPage({ searchParams }: SignInPageProps) {
  // Erst zur Anfragezeit prüfen, sonst fragt der Build die DB.
  await connection()
  if (!(await isSetUp())) redirect('/einrichten')
  const returnTo = safeReturnPath((await searchParams).weiter)
  if ((await requireUser()).ok) redirect(returnTo)
  return (
    <>
      <PageHeader title="Anmelden" subtitle="Schön, dass ihr da seid." />
      <SignInForm returnTo={returnTo} />
    </>
  )
}
