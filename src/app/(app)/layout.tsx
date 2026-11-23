import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { requireUser } from '@/server/auth/guards'
import { OfflineWriteGuard } from '@/shared/ui/OfflineWriteGuard'
import { Sidebar } from '@/shared/ui/Sidebar'
import { SkipLink } from '@/shared/ui/SkipLink'
import { TabBar } from '@/shared/ui/TabBar'

type AppLayoutProps = Readonly<{ children: ReactNode }>

const CONTENT_ID = 'inhalt'

// App-Rahmen (DESIGN_SYSTEM §6): Tab-Leiste in kompakt und mittel, Seitenleiste ab breit.
// Zugriffsschutz (#33): src/proxy.ts leitet ohne Sitzungs-Cookie samt Rücksprung zur Anmeldung.
// Hier prüft die DB, ob die Sitzung noch gilt (abgelaufen, abgemeldet, deaktiviert). Jede Seite,
// Action und Route prüft ihre Daten trotzdem selbst (requireHouseholdUser), ein Layout allein schützt
// keine Server Action.
export default async function AppLayout({ children }: AppLayoutProps) {
  if (!(await requireUser()).ok) redirect('/anmelden')
  return (
    <div className="min-h-dvh pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] breit:flex">
      <SkipLink targetId={CONTENT_ID} />
      <Sidebar />
      <main
        id={CONTENT_ID}
        className="mx-auto w-full max-w-[640px] pb-[calc(74px+env(safe-area-inset-bottom))] breit:min-h-dvh breit:max-w-none breit:bg-surface breit:pb-6"
      >
        {children}
      </main>
      <TabBar />
      <OfflineWriteGuard />
    </div>
  )
}
