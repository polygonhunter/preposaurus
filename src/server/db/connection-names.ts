// Namen der Datenbankverbindungen je Prozess (`application_name`, #261). Damit nennt
// `docker/backup/restore.sh` beim Wiederherstellen, welcher Dienst noch verbunden ist, und
// `pg_stat_activity` zeigt es auch. Die Namen sind keine Geheimnisse und stehen nur hier.
export const CONNECTION_NAMES = {
  web: 'preposaurus-web',
  worker: 'preposaurus-worker',
} as const

export type ProcessRole = keyof typeof CONNECTION_NAMES

// pg-boss erkennt eigene Verbindungen am Präfix „pgboss:“ (sonst „pgboss:<Kennung>“). Mit dem
// Präfix bleibt das so, und der Name verrät trotzdem den Worker.
export const JOB_QUEUE_CONNECTION_NAME = `pgboss:${CONNECTION_NAMES.worker}`
