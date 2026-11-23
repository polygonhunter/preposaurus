// Folgeschritte der Ersteinrichtung (#40, ONBOARDING §2.2, §2.3): Nach dem Konto führen Mitglieder,
// Ziel und, nur im iPhone-Safari, der Hinweis „Zum Home-Bildschirm“ durch. Jeder Schritt lässt sich
// überspringen. Gespeichert wird die Nummer des zuletzt erledigten Schritts (einrichtung_schritt:
// 1 Konto, 2 Mitglieder, 3 Ziel, 4 Home-Bildschirm) und der Abschluss. Reine Regeln, testbar.

const SETUP_STEPS = ['mitglieder', 'ziel', 'home-bildschirm'] as const

export type SetupStep = (typeof SETUP_STEPS)[number]

/** Das Konto ist Schritt 1, die Folgeschritte zählen ab 2. */
const FIRST_FOLLOW_UP_NUMBER = 2

export type SetupProgress = Readonly<{
  /** Leer bei Haushalten, die nicht über die Einrichtung entstanden sind (Seeds, alte Daten) */
  lastDoneStep: number | null
  completedAt: Date | null
  /** Admin, der den Haushalt eingerichtet hat. Nur er sieht die Schritte. */
  isSetupAdmin: boolean
}>

export type StepPosition = Readonly<{ number: number; total: number }>

export const isSetupStep = (value: unknown): value is SetupStep =>
  SETUP_STEPS.some((step) => step === value)

export const stepNumber = (step: SetupStep): number =>
  SETUP_STEPS.indexOf(step) + FIRST_FOLLOW_UP_NUMBER

/** Schritte, die dieses Gerät sieht. Den Home-Bildschirm gibt es nur im iPhone-Safari. */
export function visibleSteps(showsHomeStep: boolean): readonly SetupStep[] {
  return showsHomeStep ? SETUP_STEPS : SETUP_STEPS.filter((step) => step !== 'home-bildschirm')
}

export function isSetupOpen(progress: SetupProgress): boolean {
  return progress.isSetupAdmin && progress.completedAt === null && progress.lastDoneStep !== null
}

/** Erster noch offener Schritt, null wenn nichts mehr offen ist oder jemand anderes fragt. */
export function openStep(progress: SetupProgress, showsHomeStep: boolean): SetupStep | null {
  const { lastDoneStep } = progress
  if (!isSetupOpen(progress) || lastDoneStep === null) return null
  return visibleSteps(showsHomeStep).find((step) => stepNumber(step) > lastDoneStep) ?? null
}

/** Schritt nach diesem, null heißt: Die Einrichtung ist damit fertig. */
export function stepAfter(step: SetupStep, showsHomeStep: boolean): SetupStep | null {
  return visibleSteps(showsHomeStep).find((next) => stepNumber(next) > stepNumber(step)) ?? null
}

/** Für „Schritt 2 von 4“: Das Konto zählt mit, gezählt wird nur, was dieses Gerät sieht. */
export function stepPosition(step: SetupStep, showsHomeStep: boolean): StepPosition {
  const steps = visibleSteps(showsHomeStep)
  return { number: steps.indexOf(step) + FIRST_FOLLOW_UP_NUMBER, total: steps.length + 1 }
}
