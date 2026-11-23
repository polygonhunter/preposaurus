// Passwort für Anlegen und Zurücksetzen durch den Admin (EINSTELLUNGEN_NUTZER §3.1, §4.4): das
// eingegebene, wenn es die Regeln erfüllt, sonst ein erzeugtes. Ein erzeugtes Passwort, das zufällig
// einen Namen enthält, wird neu gezogen.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  findPasswordProblem,
  type PasswordContext,
  type PasswordProblem,
} from '../domain/password-rules'

const MAX_DRAWS = 5

export function choosePassword(
  chosen: string | null,
  context: PasswordContext & Readonly<{ generate: () => string }>,
): Result<string, PasswordProblem> {
  if (chosen !== null) {
    const problem = findPasswordProblem(chosen, context)
    return problem === null ? ok(chosen) : err(problem)
  }
  for (let draw = 1; draw < MAX_DRAWS; draw += 1) {
    const generated = context.generate()
    if (findPasswordProblem(generated, context) === null) return ok(generated)
  }
  return ok(context.generate())
}
