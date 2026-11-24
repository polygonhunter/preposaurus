import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { readShortcutsEnabled } from '@/features/auth/application/shortcut-preference'
import { loadNavCounts } from '@/features/supply/application/load-nav-counts'
import { requireUser } from '@/server/auth/guards'
import { cx } from '@/shared/lib/class-names'
import { KeyboardShortcuts } from '@/shared/ui/KeyboardShortcuts'
import { OfflineWriteGuard } from '@/shared/ui/OfflineWriteGuard'
import { ReturnPathTracker } from '@/shared/ui/ReturnPathTracker'
import { ShortcutsProvider } from '@/shared/ui/ShortcutsProvider'
import { Sidebar } from '@/shared/ui/Sidebar'
import { SkipLink } from '@/shared/ui/SkipLink'
import { TabBar } from '@/shared/ui/TabBar'

type AppFrameProps = Readonly<{
  children: ReactNode
  // Erfassen (UX_KONZEPT §6): ohne Tab-Leiste, die Seitenleiste ab „breit“ bleibt (#285)
  isFocused?: boolean
}>

const CONTENT_ID = 'inhalt'

const MAIN =
  'mx-auto w-full max-w-[640px] breit:min-h-dvh breit:max-w-none breit:min-w-0 breit:bg-surface breit:pb-6'
// Platz für die feste Tab-Leiste, ohne sie nur für die Safe Area
const MAIN_WITH_TAB_BAR = 'pb-[calc(74px+env(safe-area-inset-bottom))]'
const MAIN_FOCUSED = 'pb-[env(safe-area-inset-bottom)]'

// App-Rahmen (DESIGN_SYSTEM §6) für die Layouts (app) und (erfassen): Tab-Leiste in kompakt und
// mittel, Seitenleiste mit Zählern ab breit, Tastenkürzel „/“ und „n“ überall, abschaltbar unter
// Mein Konto (#254). Zugriffsschutz (#33): src/proxy.ts leitet ohne Sitzungs-Cookie samt Rücksprung
// zur Anmeldung. Hier prüft die DB, ob die Sitzung noch gilt (abgelaufen, abgemeldet, deaktiviert).
// Jede Seite, Action und Route prüft ihre Daten trotzdem selbst (requireHouseholdUser), ein Layout
// allein schützt keine Server Action. Seiten im Rahmen merken sich als Ziel für „Abbrechen“.
export async function AppFrame({ children, isFocused = false }: AppFrameProps) {
  const access = await requireUser()
  if (!access.ok) redirect('/anmelden')
  const { householdId } = access.value
  const counts = householdId === null ? null : await loadNavCounts(householdId)
  const areShortcutsOn = await readShortcutsEnabled()
  return (
    <ShortcutsProvider isEnabled={areShortcutsOn}>
      <div className="min-h-dvh pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] breit:flex">
        <SkipLink targetId={CONTENT_ID} />
        <Sidebar counts={counts} />
        <main id={CONTENT_ID} className={cx(MAIN, isFocused ? MAIN_FOCUSED : MAIN_WITH_TAB_BAR)}>
          {children}
        </main>
        {isFocused ? null : <TabBar />}
        {isFocused ? null : <ReturnPathTracker />}
        <OfflineWriteGuard />
        {areShortcutsOn ? <KeyboardShortcuts /> : null}
      </div>
    </ShortcutsProvider>
  )
}
