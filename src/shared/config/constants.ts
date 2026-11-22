// Feste Wertelisten, die Datenbank, Schemas und Oberfläche teilen (CODE_PRINZIPIEN §4).
// Die Werte stehen so auch in den CHECK-Constraints der Migrationen. Wer einen Wert ändert,
// braucht deshalb eine neue Migration.

export const USER_ROLES = ['admin', 'mitglied'] as const
