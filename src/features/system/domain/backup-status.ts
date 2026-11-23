// Letzte Sicherung für „Daten & System“ (#147). Der Backup-Dienst schreibt zwei kleine Textdateien
// (docker/backup/common.sh): „letzter-lauf“ nach jedem Lauf („ok <Zeitpunkt> <art>/<stand>“ oder
// „fehler <Zeitpunkt> <art>“) und „letzte-sicherung“ nur nach Erfolg („<Zeitpunkt> <art>/<stand>“).
// Hier steht nur, wie die App die Zeilen liest und bewertet, ohne Dateizugriff.

const BACKUP_KINDS = [
  'taeglich',
  'woechentlich',
  'manuell',
  'vor-update',
  'vor-wiederherstellung',
] as const

export type BackupKind = (typeof BACKUP_KINDS)[number]

// Wie der Healthcheck des Containers: Nach 26 Stunden fehlt eine tägliche Sicherung.
const BACKUP_STALE_HOURS = 26
const HOUR_MS = 60 * 60 * 1000

export type BackupFiles = Readonly<{ lastRun: string | null; lastBackup: string | null }>

type LastBackup = Readonly<{ at: Date; kind: BackupKind }>

export type BackupStatus =
  | Readonly<{ state: 'unknown' }>
  | Readonly<{ state: 'ok' | 'stale' | 'failed'; lastBackup: LastBackup | null }>

const isBackupKind = (text: string): text is BackupKind =>
  (BACKUP_KINDS as readonly string[]).includes(text)

function parseTime(text: string | undefined): Date | null {
  if (text === undefined) return null
  const time = new Date(text)
  return Number.isNaN(time.getTime()) ? null : time
}

function parseKind(target: string | undefined): BackupKind | null {
  const kind = target?.split('/')[0]
  return kind !== undefined && isBackupKind(kind) ? kind : null
}

function parseLastBackup(text: string | null): LastBackup | null {
  const [time, target] = (text ?? '').trim().split(/\s+/)
  const at = parseTime(time)
  const kind = parseKind(target)
  return at === null || kind === null ? null : { at, kind }
}

function parseFailedRun(text: string | null): Date | null {
  const [outcome, time] = (text ?? '').trim().split(/\s+/)
  return outcome === 'fehler' ? parseTime(time) : null
}

const isStale = (backup: LastBackup, now: Date) =>
  now.getTime() - backup.at.getTime() > BACKUP_STALE_HOURS * HOUR_MS

/**
 * Bewertet die Dateien des Backup-Dienstes. Ohne lesbare Datei ist der Stand unbekannt (kein
 * Dienst oder noch kein Lauf). Ein Fehlschlag zählt nur, wenn er nach der letzten Sicherung kam.
 */
export function evaluateBackupStatus(files: BackupFiles, now: Date): BackupStatus {
  const lastBackup = parseLastBackup(files.lastBackup)
  const failedAt = parseFailedRun(files.lastRun)
  if (failedAt !== null && (lastBackup === null || failedAt >= lastBackup.at)) {
    return { state: 'failed', lastBackup }
  }
  if (lastBackup === null) return { state: 'unknown' }
  return { state: isStale(lastBackup, now) ? 'stale' : 'ok', lastBackup }
}
