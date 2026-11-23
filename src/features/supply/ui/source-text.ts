// Satz der Übersicht, wenn es keine Tage gibt (#20, #206). Rein, damit es Tests gibt. Der Hinweis
// auf ungeprüfte Werte steht in shared/config/recommendation-source.ts.
import { GOAL_PATH, MEMBERS_PATH } from '@/shared/config/settings-paths'
import type { OverviewHousehold } from '../schemas'

type NoNeedState = Readonly<{ text: string; action: { href: string; label: string } }>

// Ohne Quelle hilft kein Knopf in der App: Die Werte kommen mit den Stammdaten (db:seed bzw. der
// Dienst „migrate“ im Container). Deshalb der Weg zu „Ziel und Empfehlung“, wo das steht.
const NO_SOURCE: NoNeedState = {
  text: 'Es fehlt noch eine Empfehlung für Essen und Wasser. Bis sie hinterlegt ist, zeigt Preposaurus keine Tage.',
  action: { href: GOAL_PATH, label: 'Ziel und Empfehlung' },
}

const NO_MEMBERS: NoNeedState = {
  text: 'Tragt ein, wer zum Haushalt gehört. Dann seht ihr hier, wie lange euer Vorrat reicht.',
  action: { href: MEMBERS_PATH, label: 'Mitglieder eintragen' },
}

// Babys zählen vorläufig nicht im Bedarf (L20). Sind nur sie eingetragen, gibt es keinen Bedarf.
const ONLY_UNCOUNTED: NoNeedState = {
  text: 'Babys zählen im Bedarf noch nicht mit. Tragt alle weiteren Personen ein, dann seht ihr hier die Tage.',
  action: { href: MEMBERS_PATH, label: 'Mitglieder eintragen' },
}

/** Warum die Übersicht keine Tage zeigt, mit genau einer Handlung, die weiterhilft. */
export function noNeedState({ members, source }: OverviewHousehold): NoNeedState {
  if (source === null) return NO_SOURCE
  return members === 0 ? NO_MEMBERS : ONLY_UNCOUNTED
}
