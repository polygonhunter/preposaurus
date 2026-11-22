// Ausgabe der Notfall-Befehle: Terminal für den Menschen, dazu eine Spur im Log von web.
import { appendFileSync } from 'node:fs'
import { createLogger } from '../../src/shared/lib/logger'

// Ausgabe des Hauptprozesses im Container: So steht die Spur auch in "docker compose logs web".
const CONTAINER_LOG = '/proc/1/fd/1'

export const print = (text: string) => process.stdout.write(`${text}\n`)

export const fail = (text: string) => {
  process.stderr.write(`${text}\n`)
  process.exitCode = 1
}

function writeLogLine(line: string): void {
  print(line)
  try {
    appendFileSync(CONTAINER_LOG, `${line}\n`)
  } catch {
    // Außerhalb des Containers gibt es dieses Ziel nicht. Die Zeile steht dann nur im Terminal.
  }
}

/** Eine Warnzeile ohne Geheimnisse, die im Terminal und im Log von web steht. */
export function leaveTrace(message: string, context?: Readonly<Record<string, unknown>>): void {
  createLogger({ level: 'info', sink: writeLogLine }).warn(message, context)
}

export const INVALID_USERNAME =
  'Der Benutzername hat 3 bis 30 Zeichen: Buchstaben, Ziffern, Punkt oder Unterstrich.'

export const unknownUser = (username: string) => `Einen Nutzer „${username}“ gibt es nicht.`
