import type { ReactNode } from 'react'
import {
  ACCOUNT_PATH,
  CATEGORIES_PATH,
  FOOD_TYPES_PATH,
  GOAL_PATH,
  MEMBERS_PATH,
  RULES_PATH,
  STORAGE_LOCATIONS_PATH,
} from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { NavRow } from '@/shared/ui/NavRow'
import { Row } from '@/shared/ui/Row'
import { AdminSettingsGroups } from './AdminSettingsGroups'
import { SystemSettingsGroup } from './SystemSettingsGroup'

export type SettingsSummary = Readonly<{
  username: string
  roleLabel: string
  isAdmin: boolean
  memberCount: number
  goalSummary: string
  locationCount: number
  stillGoodCounts: boolean
}>

type SettingsOverviewProps = Readonly<{
  summary: SettingsSummary
  /** Abmelden, kommt aus dem Feature auth */
  signOut: ReactNode
}>

const personCount = (count: number) => (count === 1 ? '1 Person' : `${String(count)} Personen`)

const locationCount = (count: number) => (count === 1 ? '1 Ort' : `${String(count)} Orte`)

// Der aktuelle Wert steht kompakt rechts in der Zeile (UX §8.6). Ab „breit“ ist die Liste schmal
// (Spalte neben dem Inhalt), dort steht er unter dem Titel, damit der Titel lesbar bleibt.
function valueOf(value: string | undefined) {
  if (value === undefined) return {}
  return {
    trailing: <span className="breit:hidden">{value}</span>,
    subtitle: <span className="hidden breit:inline">{value}</span>,
  }
}

// Bereiche der Einstellungen (#37): Mein Konto · Haushalt · Nutzerverwaltung · Daten & System.
// Mitglieder sehen den Haushalt nur lesend und die Nutzerverwaltung gar nicht (die Seiten prüfen die
// Rolle selbst). Daten & System mit Lizenz und Quelltext sehen alle (AGPL, #217).
export function SettingsOverview({ summary, signOut }: SettingsOverviewProps) {
  const { isAdmin } = summary
  return (
    <>
      <GroupHeader id="bereiche-konto">Mein Konto</GroupHeader>
      <Group labelledBy="bereiche-konto">
        <Row title="Angemeldet als" {...valueOf(summary.username)} />
        <Row title="Rolle" {...valueOf(summary.roleLabel)} />
        <NavRow title="Profil, Passwort und Mails" href={ACCOUNT_PATH} />
      </Group>
      <div className="pt-4">{signOut}</div>
      <GroupHeader id="bereiche-haushalt">Haushalt</GroupHeader>
      <Group labelledBy="bereiche-haushalt">
        <NavRow
          title="Mitglieder und Ernährung"
          {...valueOf(personCount(summary.memberCount))}
          href={MEMBERS_PATH}
        />
        <NavRow title="Ziel und Empfehlung" {...valueOf(summary.goalSummary)} href={GOAL_PATH} />
        <NavRow
          title="Lagerorte"
          {...valueOf(locationCount(summary.locationCount))}
          href={STORAGE_LOCATIONS_PATH}
        />
        <NavRow
          title="Kategorien und Lebensmittelarten"
          href={CATEGORIES_PATH}
          alsoCurrentOn={[FOOD_TYPES_PATH]}
        />
        <NavRow
          title="Vorrat und Regeln"
          {...valueOf(summary.stillGoodCounts ? '„Noch gut“ zählt' : undefined)}
          href={RULES_PATH}
        />
      </Group>
      {isAdmin ? null : (
        <GroupFooter>Ansehen kannst du alles, ändern kann es ein Admin.</GroupFooter>
      )}
      {isAdmin ? <AdminSettingsGroups /> : null}
      <SystemSettingsGroup isAdmin={isAdmin} />
    </>
  )
}
