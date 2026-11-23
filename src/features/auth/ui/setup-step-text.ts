import type { StepPosition } from '../domain/setup-steps'

// Schrittanzeige als schlichter Text über dem Titel (ONBOARDING §2.3, DESIGN_SYSTEM: kein Balken).
export const stepText = ({ number, total }: StepPosition) =>
  `Schritt ${String(number)} von ${String(total)}`
