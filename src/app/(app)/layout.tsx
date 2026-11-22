import type { ReactNode } from 'react'
import { Sidebar } from '@/shared/ui/Sidebar'
import { SkipLink } from '@/shared/ui/SkipLink'
import { TabBar } from '@/shared/ui/TabBar'

type AppLayoutProps = Readonly<{ children: ReactNode }>

const CONTENT_ID = 'inhalt'

// App-Rahmen (DESIGN_SYSTEM §6): Tab-Leiste in kompakt und mittel, Seitenleiste ab breit.
// TODO(#33): Hier die Sitzung prüfen (requireUser aus src/server/auth/guards.ts) und ohne
// Anmeldung auf /anmelden leiten. Bis dahin ist der Rahmen ungeschützt.
export default function AppLayout({ children }: AppLayoutProps) {
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
    </div>
  )
}
