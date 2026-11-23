// Kurze Anzeigenamen der Warengruppen (#177). Die Stammdaten tragen die amtlichen Namen aus den
// Empfehlungen (db/seeds/stammdaten/warengruppen.ts), etwa „Getreide, Getreideprodukte, Brot und
// Kartoffeln“. Als Large Title, in der Pfadzeile und im Zurück-Link brechen sie auf dem Handy über
// mehrere Zeilen um. Titel und Navigation nutzen deshalb den Kurznamen, der amtliche Name bleibt
// als Untertitel sichtbar. Gruppen ohne Eintrag zeigen überall ihren amtlichen Namen.
// Eine Konstante statt einer Spalte: Die Schlüssel der Warengruppen sind fest, eine Migration
// lohnt erst, wenn Gruppen in der App bearbeitbar werden.
const SHORT_NAMES: Readonly<Record<string, string>> = {
  getreide: 'Getreide und Kartoffeln',
}

/** Kurzer Anzeigename einer Warengruppe, ohne Eintrag der amtliche Name. */
export function productGroupShortName(key: string, name: string): string {
  return SHORT_NAMES[key] ?? name
}
