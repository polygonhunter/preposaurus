'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'
import { FOLD_SPLIT_MARKER, SPLIT_COLUMNS } from '@/shared/ui/split-columns'

type SettingsSplitProps = Readonly<{
  /** Liste der Bereiche (SettingsOverview) */
  list: ReactNode
  /** Der gewählte Bereich, auf /einstellungen selbst der Hinweis für „breit“ */
  children: ReactNode
}>

// Ab „breit“ die Liste fest 340 px bzw. mit Falz bis zur Falz (SPLIT_COLUMNS), ab „weit“ 360 px.
// Der Bereich daneben ist höchstens so breit wie eine Lesespalte.
const COLUMNS = cx(SPLIT_COLUMNS, 'weit:grid-cols-[360px_minmax(0,1fr)]')
const CONTENT_PANE = 'min-w-0 breit:col-start-2 breit:row-start-1 weit:max-w-3xl'
const LIST_PANE =
  'pb-6 breit:sticky breit:top-0 breit:col-start-1 breit:row-start-1 breit:h-dvh breit:overflow-y-auto breit:border-r breit:border-line'

// Einstellungen (UX §8.6 „Auf breit: Liste links, Bereich rechts“, M12-06). Kompakt ist die Liste
// die Seite /einstellungen und jeder Bereich eine eigene Seite mit „Zurück“. Ab „breit“ steht die
// Liste neben jedem Bereich, die gewählte Zeile ist markiert. Die Auswahl bleibt die Adresse, Zurück
// und Neu laden funktionieren wie gewohnt. Im DOM steht der Bereich zuerst (Hauptinhalt).
export function SettingsSplit({ list, children }: SettingsSplitProps) {
  const isIndex = usePathname() === SETTINGS_PATH
  return (
    <div {...FOLD_SPLIT_MARKER} className={COLUMNS}>
      <div className={CONTENT_PANE}>{children}</div>
      <section
        aria-label="Bereiche der Einstellungen"
        className={cx(LIST_PANE, !isIndex && 'hidden breit:block')}
      >
        <PageHeader
          title="Einstellungen"
          back={{ href: '/uebersicht', label: 'Übersicht' }}
          level={isIndex ? 1 : 2}
        />
        {list}
      </section>
    </div>
  )
}
