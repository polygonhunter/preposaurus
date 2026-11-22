// Prüft, dass die DB eine Zeile wegen eines bestimmten Constraints ablehnt.
// PGlite und node-postgres verpacken den Fehler unterschiedlich, die Meldung von PostgreSQL
// nennt den Constraint aber bei beiden.
import { expect } from 'vitest'

function collectMessages(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  return `${error.message} ${error.cause === undefined ? '' : collectMessages(error.cause)}`
}

export async function expectConstraintViolation(
  operation: PromiseLike<unknown>,
  constraint: string,
): Promise<void> {
  let failure: unknown
  try {
    await operation
  } catch (error) {
    failure = error
  }
  expect(failure, `erwartet: Verstoß gegen ${constraint}`).toBeDefined()
  expect(collectMessages(failure)).toContain(constraint)
}
