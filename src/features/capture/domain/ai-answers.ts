// Form der KI-Antworten, wie die Fachlogik sie liest. Die Quelle ist das Zod-Schema in
// capture/schemas.ts. domain/ darf kein Zod importieren, deshalb stehen die Typen hier noch
// einmal. Ein Typtest (src/server/ai/schema-types.test.ts) hält beide deckungsgleich.
// Die Feldnamen sind deutsch, weil sie im Schema an die KI gehen (technik.html#api-ki).

export type AiConfidence = 'hoch' | 'mittel' | 'niedrig'

/** Schema A · Verpackung */
export interface AiPackagingAnswer {
  bezeichnung: string | null
  /** Schlüssel aus der zur Laufzeit übergebenen Liste des Haushalts (#110) */
  lebensmittelart: string | null
  behaelter: 'dose' | 'glas' | 'packung' | 'flasche' | 'tetrapak' | 'beutel' | 'sonstiges'
  inhalt: { wert: number | null; einheit: 'g' | 'ml' | null }
  abtropfgewicht_g: number | null
  sicherheit: AiConfidence
}

/** Schema B · Nährwerttabelle, so wie aufgedruckt */
export interface AiNutritionAnswer {
  bezug: '100g' | '100ml' | 'portion'
  portionsgroesse: number | null
  kcal: number | null
  kj: number | null
  eiweiss_g: number | null
  kohlenhydrate_g: number | null
  fett_g: number | null
  sicherheit: AiConfidence
}

/** Schätzung ohne Nährwerttabelle (#124), immer je 100 g bzw. 100 ml */
export interface AiNutritionEstimateAnswer {
  kcal: number | null
  eiweiss_g: number | null
  kohlenhydrate_g: number | null
  fett_g: number | null
  sicherheit: AiConfidence
}

/** Schema C · MHD, gleich für den Zweitversuch */
export interface AiBestBeforeAnswer {
  roh_text: string | null
  datum: string | null
  genauigkeit: 'tag' | 'monat' | 'jahr' | 'unbekannt'
  art: 'mhd' | 'verbrauchen_bis' | 'unbekannt'
  sicherheit: AiConfidence
}
