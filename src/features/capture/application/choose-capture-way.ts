// Welchen Weg der Erfassen-Knopf öffnet (UX §8.5): den zuletzt genutzten. Beim ersten Mal das
// Foto, wenn die Erkennung eingerichtet ist, sonst das Formular. Ob die Kamera erlaubt ist, weiß
// nur das Gerät: Ohne Kamera bietet der Foto-Weg selbst „Von Hand eintragen“ als Hauptknopf an.
import 'server-only'
import { loadAiConfig } from '@/features/ai-settings/application/ai-config-service'
import { findLastCaptureMethod } from '../data/last-capture-method'
import type { CaptureMethod } from '../domain/stock-draft'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'

export async function chooseCaptureWay(
  deps: Pick<CaptureDeps, 'db' | 'env'>,
  actor: CaptureActor,
): Promise<CaptureMethod> {
  const last = await findLastCaptureMethod(deps.db, actor)
  if (last !== null) return last
  const config = await loadAiConfig(deps, actor.householdId)
  return config.forRole('verpackung').ok ? 'photo' : 'manual'
}
