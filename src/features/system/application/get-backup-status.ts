// Letzte Sicherung für „Daten & System“ (#147). Liest die Status-Dateien des Backup-Dienstes aus
// BACKUP_STATUS_DIR (im Container nur lesend eingebunden) und bewertet sie mit der Fachlogik.
import 'server-only'
import { readBackupStatusFiles } from '@/server/backup/read-backup-status-files'
import { loadEnv } from '@/shared/config/env'
import { evaluateBackupStatus, type BackupStatus } from '../domain/backup-status'

export async function getBackupStatus(): Promise<BackupStatus> {
  const files = await readBackupStatusFiles(loadEnv().BACKUP_STATUS_DIR)
  return evaluateBackupStatus(files, new Date())
}
