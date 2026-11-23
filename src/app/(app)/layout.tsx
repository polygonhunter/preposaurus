import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { loadNavCounts } from '@/features/supply/application/load-nav-counts'
import { requireUser } from '@/server/auth/guards'
import { KeyboardShortcuts } from '@/shared/ui/KeyboardShortcuts'
import { OfflineWriteGuard } from '@/shared/ui/OfflineWriteGuard'
import { Sidebar } from '@/shared/ui/Sidebar'
import { SkipLink } from '@/shared/ui/SkipLink'
import { TabBar } from '@/shared/ui/TabBar'

type AppLayoutProps = Readonly<{ children: ReactNode }>

const CONTENT_ID = 'inhalt'

// App-Rahmen (DESIGN_SYSTEM §6): Tab-Leiste in kompakt und mittel, Seitenleiste mit Zählern ab breit,
// Tastenkürzel „/“ und „n“ überall.
// Zugriffsschutz (#33): src/proxy.ts leitet ohne Sitzungs-Cookie samt Rücksprung zur Anmeldung.
// Hier prüft die DB, ob die Sitzung noch gilt (abgelaufen, abgemeldet, deaktiviert). Jede Seite,
// Action und Route prüft ihre Daten trotzdem selbst (requireHouseholdUser), ein Layout allein schützt
// keine Server Action.
export default async function AppLayout({ children }: AppLayoutProps) {
  const access = await requireUser()
  if (!access.ok) redirect('/anmelden')
  const { householdId } = access.value
  const counts = householdId === null ? null : await loadNavCounts(householdId)
  return (
    <div className="min-h-dvh pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] breit:flex">
      <SkipLink targetId={CONTENT_ID} />
      <Sidebar counts={counts} />
      <main
        id={CONTENT_ID}
        className="mx-auto w-full max-w-[640px] pb-[calc(74px+env(safe-area-inset-bottom))] breit:min-h-dvh breit:max-w-none breit:min-w-0 breit:bg-surface breit:pb-6"
      >
        {children}
      </main>
      <TabBar />
      <OfflineWriteGuard />
      <KeyboardShortcuts />
    </div>
  )
}
