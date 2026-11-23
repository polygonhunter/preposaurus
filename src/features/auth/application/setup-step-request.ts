// Verdrahtet die Folgeschritte der Einrichtung (#40) mit DB, Sitzung und Browserkennung. Den
// Hinweis „Zum Home-Bildschirm“ braucht nur Safari auf dem iPhone (dieselbe Regel wie auf der
// Übersicht). Ob die App schon installiert ist, weiß erst der Browser; dann überspringt die Seite
// des Schritts sich selbst (SkipWhenInstalled).
import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requirePageHousehold } from '@/server/auth/household'
import { getDb } from '@/server/db/get-db'
import {
  SETUP_GOAL_PATH,
  SETUP_HOME_SCREEN_PATH,
  SETUP_MEMBERS_PATH,
} from '@/shared/config/setup-paths'
import { shouldShowInstallHint } from '@/shared/lib/install-hint'
import { createSetupProgressRepository } from '../data/setup-progress-repository'
import { DEFAULT_RETURN_PATH } from '../domain/return-path'
import {
  stepNumber,
  stepPosition,
  visibleSteps,
  type SetupStep,
  type StepPosition,
} from '../domain/setup-steps'
import {
  completeSetupStep,
  findOpenSetupStep,
  readOpenSetup,
  type SetupStepDeps,
} from './setup-steps'

const STEP_PATHS: Record<SetupStep, string> = {
  mitglieder: SETUP_MEMBERS_PATH,
  ziel: SETUP_GOAL_PATH,
  'home-bildschirm': SETUP_HOME_SCREEN_PATH,
}

async function setupStepDeps(): Promise<SetupStepDeps> {
  return { repository: createSetupProgressRepository(await getDb()), now: () => new Date() }
}

async function showsHomeStep(): Promise<boolean> {
  const userAgent = (await headers()).get('user-agent') ?? ''
  return shouldShowInstallHint({ userAgent, isStandalone: false, isDismissed: false })
}

/** Adresse des offenen Schritts für Anmelden und Übersicht, null wenn keiner offen ist. */
export async function openSetupPath(userId: string): Promise<string | null> {
  const query = { userId, showsHomeStep: await showsHomeStep() }
  const step = await findOpenSetupStep(await setupStepDeps(), query)
  return step === null ? null : STEP_PATHS[step]
}

/** Erledigt den Schritt und nennt die Adresse danach: nächster Schritt oder die Übersicht. */
export async function continueSetupFromRequest(userId: string, step: SetupStep): Promise<string> {
  const query = { userId, step, showsHomeStep: await showsHomeStep() }
  const result = await completeSetupStep(await setupStepDeps(), query)
  return result.ok && result.value !== null ? STEP_PATHS[result.value] : DEFAULT_RETURN_PATH
}

type SetupStepPage = Readonly<{ householdId: string; position: StepPosition }>

// Vorblättern über den offenen Schritt hinaus führt zu ihm, ein Schritt, den dieses Gerät nicht
// sieht, ebenso. Zurückblättern bleibt möglich.
function redirectTarget(step: SetupStep, open: SetupStep | null, isHomeVisible: boolean) {
  const openPath = open === null ? DEFAULT_RETURN_PATH : STEP_PATHS[open]
  if (!visibleSteps(isHomeVisible).includes(step)) return openPath
  if (open !== null && stepNumber(step) > stepNumber(open)) return openPath
  return null
}

/** Für die Seiten der Schritte: nur der Admin, der eingerichtet hat, solange sie offen ist. */
export async function requireSetupStepPage(step: SetupStep): Promise<SetupStepPage> {
  const { userId } = await requirePageHousehold()
  const isHomeVisible = await showsHomeStep()
  const setup = await readOpenSetup(await setupStepDeps(), {
    userId,
    showsHomeStep: isHomeVisible,
  })
  if (!setup.ok) redirect(DEFAULT_RETURN_PATH)
  const target = redirectTarget(step, setup.value.openStep, isHomeVisible)
  if (target !== null) redirect(target)
  return {
    householdId: setup.value.householdId,
    position: stepPosition(step, isHomeVisible),
  }
}
