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

type GenerateContext = PasswordContext & Readonly<{ generate: () => string }>

/** Erzeugtes Passwort, das die Regeln erfüllt (auch für die Kommandozeile, #174). */
export function generateAllowedPassword(context: GenerateContext): string {
  for (let draw = 1; draw < MAX_DRAWS; draw += 1) {
    const generated = context.generate()
    if (findPasswordProblem(generated, context) === null) return generated
  }
  return context.generate()
}

export function choosePassword(
  chosen: string | null,
  context: GenerateContext,
): Result<string, PasswordProblem> {
  if (chosen === null) return ok(generateAllowedPassword(context))
  const problem = findPasswordProblem(chosen, context)
  return problem === null ? ok(chosen) : err(problem)
}
