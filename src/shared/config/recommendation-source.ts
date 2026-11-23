// Die aktive Empfehlungsquelle, wie Übersicht, Einstellungen und Erklär-Blätter sie nennen (#20,
// #219, #230). Zentral, damit der Hinweis auf ungeprüfte Werte überall gleich lautet.

/** Quelle mit Stand und Link, dazu ob jemand die Werte gegen das Original geprüft hat (M1-09). */
export type RecommendationSource = Readonly<{
  name: string
  asOf: string
  link: string
  isVerified: boolean
}>

/** Dezent an der Quelle, solange niemand die Werte gegen das Original geprüft hat (M1-09). */
export const UNVERIFIED_SOURCE_NOTE = 'Werte noch nicht geprüft'
