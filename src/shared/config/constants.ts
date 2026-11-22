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
