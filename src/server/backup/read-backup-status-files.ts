// Liest die Status-Dateien des Backup-Dienstes (#147). Der Ordner ist im Container `web` nur lesend
// eingebunden (compose.yaml, BACKUP_STATUS_DIR). Die App sieht nur diese zwei Textzeilen, nie die
// Sicherungen selbst. Fehlt der Ordner oder eine Datei, ist der Wert leer.
import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createLogger } from '@/shared/lib/logger'

const LAST_RUN_FILE = 'letzter-lauf'
const LAST_BACKUP_FILE = 'letzte-sicherung'
// Eine Zeile reicht; mehr liest die App nie, auch wenn jemand eine große Datei ablegt.
const MAX_LENGTH = 512

const logger = createLogger({ level: 'warn' })

const isMissing = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT'

async function readSmallText(path: string): Promise<string | null> {
  try {
    return (await readFile(path, 'utf8')).slice(0, MAX_LENGTH)
  } catch (error: unknown) {
    // Fehlt die Datei, gab es noch keinen Lauf. Alles andere (z. B. Rechte) gehört ins Log.
    if (!isMissing(error)) logger.warn('Status des Backup-Dienstes nicht lesbar', { path, error })
    return null
  }
}

export async function readBackupStatusFiles(
  directory: string | undefined,
): Promise<Readonly<{ lastRun: string | null; lastBackup: string | null }>> {
  if (directory === undefined) return { lastRun: null, lastBackup: null }
  const [lastRun, lastBackup] = await Promise.all([
    readSmallText(join(directory, LAST_RUN_FILE)),
    readSmallText(join(directory, LAST_BACKUP_FILE)),
  ])
  return { lastRun, lastBackup }
}
