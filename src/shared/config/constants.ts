// Feste Wertelisten, die Datenbank, Schemas und Oberfläche teilen (CODE_PRINZIPIEN §4).
// Die Werte stehen so auch in den CHECK-Constraints der Migrationen. Wer einen Wert ändert,
// braucht deshalb eine neue Migration.

export const USER_ROLES = ['admin', 'mitglied'] as const

// Rechenmodus des Haushalts (02_HAUSHALT_ZIEL §1 „Zwei Rechenmodi“)
export const CALCULATION_MODES = ['offiziell', 'individuell'] as const

export const DIETS = ['alles', 'vegetarisch', 'vegan'] as const

export const MEMBER_TYPES = ['baby', 'kind', 'jugendlich', 'erwachsen', 'senior'] as const

export const SEXES = ['weiblich', 'maennlich', 'divers'] as const

// wenig · normal · viel (PAL 1,4 / 1,6 / 1,8). Leer heißt „normal“.
export const ACTIVITY_LEVELS = ['wenig', 'normal', 'viel'] as const

export const MEMBER_CONDITIONS = ['schwanger', 'stillend'] as const

export const DEFAULT_AMPEL_YELLOW_DAYS = 90
export const DEFAULT_AMPEL_ORANGE_DAYS = 28

// Wochenübersicht standardmäßig samstags (ISO-Wochentag 6) um 10:00 Uhr
export const DEFAULT_WEEKLY_SUMMARY_WEEKDAY = 6
export const DEFAULT_WEEKLY_SUMMARY_TIME = '10:00'

// Maßeinheit für Inhalt und Empfehlungsmengen. Wasser und Getränke in ml, sonst g.
export const QUANTITY_UNITS = ['g', 'ml'] as const

// Gespeicherter Zustand einer Einheit. „Gut“, „bald fällig“ und „abgelaufen“ werden berechnet.
export const UNIT_STATUSES = ['vorrat', 'verbraucht', 'entsorgt'] as const

// Wie genau das aufgedruckte Datum ist (z. B. „Ende 2027“ = jahr).
export const BEST_BEFORE_PRECISIONS = ['tag', 'monat', 'jahr'] as const

export const BEST_BEFORE_KINDS = ['mhd', 'verbrauchen_bis'] as const

export const PHOTO_ROLES = ['verpackung', 'naehrwerte', 'mhd'] as const

// Weg einer bestätigten Erfassung (DATENKATALOG §2.9): Vorbelegung beim nächsten Erfassen.
export const CAPTURE_METHODS = ['foto', 'manuell'] as const

// Wie sicher sich die KI bei einem Ergebnis ist (KI-Schemas A–C, #114).
export const AI_CONFIDENCE_LEVELS = ['hoch', 'mittel', 'niedrig'] as const

// entwurf: gehört zu einer unbestätigten Erfassung. fest: gehört zu einem gespeicherten Produkt.
export const PHOTO_STATUSES = ['entwurf', 'fest'] as const

// Die Lücke zum Ziel wird live berechnet und nicht gespeichert, deshalb fehlt „ziel“.
export const RESTOCK_SOURCES = ['nachkauf', 'manuell'] as const

export const RESTOCK_UNITS = ['g', 'ml', 'stueck'] as const

// ERI-02 Wochenübersicht, ERI-03 Dringend, ERI-06 Check-in-Mail. Etappe und Inventur kommen später.
export const NOTIFICATION_KINDS = ['wochenuebersicht', 'dringend', 'checkin_mail'] as const

// Anbieter einer KI-Verbindung (Issue #108). Weitere (z. B. openai, lokal) brauchen nur einen
// weiteren Wert, eine Migration und einen Adapter.
export const AI_PROVIDERS = ['anthropic'] as const

// Ergebnis von „Verbindung testen“ (Issue #108)
export const AI_CONNECTION_STATUSES = [
  'ok',
  'schluessel_ungueltig',
  'kein_guthaben',
  'zeitueberschreitung',
  'fehler',
] as const

// Woher die Nährwerte eines Produkts stammen. ki_schaetzung und richtwert sind Schätzungen,
// die gesondert bestätigt werden müssen (naehrwerte_bestaetigt_am).
export const NUTRITION_SOURCES = ['tabelle', 'ki_schaetzung', 'richtwert', 'manuell'] as const
