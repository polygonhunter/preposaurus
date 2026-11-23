// Folgeschritte der Ersteinrichtung (#40): offenen Schritt finden und einen Schritt erledigen
// (ausgefüllt oder übersprungen). Nur der Admin, der eingerichtet hat, sieht die Schritte. Der
// letzte sichtbare Schritt schließt die Einrichtung ab. Ob das Gerät den Hinweis „Zum
// Home-Bildschirm“ braucht, entscheidet der Aufrufer (Browserkennung).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { SetupProgressRepository } from '../data/setup-progress-repository'
import { isSetupOpen, openStep, stepAfter, stepNumber, type SetupStep } from '../domain/setup-steps'

export type SetupStepDeps = Readonly<{
  repository: SetupProgressRepository
  now: () => Date
}>

type SetupQuery = Readonly<{ userId: string; showsHomeStep: boolean }>

export interface SetupClosedError {
  kind: 'setup-closed'
}

export type OpenSetup = Readonly<{
  householdId: string
  /** Erster noch offener Schritt, null wenn auf diesem Gerät alles erledigt ist */
  openStep: SetupStep | null
}>

/** Erster offener Schritt für diesen Nutzer, null für alle anderen und nach dem Abschluss. */
export async function findOpenSetupStep(
  deps: SetupStepDeps,
  query: SetupQuery,
): Promise<SetupStep | null> {
  const progress = await deps.repository.readForUser(query.userId)
  return progress === null ? null : openStep(progress, query.showsHomeStep)
}

/** Für die Seiten der Schritte: Zurückblättern ist erlaubt, solange die Einrichtung offen ist. */
export async function readOpenSetup(
  deps: SetupStepDeps,
  query: SetupQuery,
): Promise<Result<OpenSetup, SetupClosedError>> {
  const progress = await deps.repository.readForUser(query.userId)
  if (progress === null || !isSetupOpen(progress)) return err({ kind: 'setup-closed' })
  return ok({
    householdId: progress.householdId,
    openStep: openStep(progress, query.showsHomeStep),
  })
}

/** Erledigt einen Schritt und nennt den nächsten. null heißt: Die Einrichtung ist abgeschlossen. */
export async function completeSetupStep(
  deps: SetupStepDeps,
  query: SetupQuery & Readonly<{ step: SetupStep }>,
): Promise<Result<SetupStep | null, SetupClosedError>> {
  const progress = await deps.repository.readForUser(query.userId)
  if (progress === null || !isSetupOpen(progress)) return err({ kind: 'setup-closed' })
  const change = { householdId: progress.householdId, step: stepNumber(query.step) }
  const next = stepAfter(query.step, query.showsHomeStep)
  if (next === null) await deps.repository.complete({ ...change, now: deps.now() })
  else await deps.repository.markDone(change)
  return ok(next)
}
