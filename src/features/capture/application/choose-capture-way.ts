// Welchen Weg der Erfassen-Knopf öffnet (UX §8.5): den zuletzt genutzten. Beim ersten Mal das
// Foto, wenn die Erkennung eingerichtet ist, sonst das Formular. Ob die Kamera erlaubt ist, weiß
// nur das Gerät: Ohne Kamera bietet der Foto-Weg selbst „Von Hand eintragen“ als Hauptknopf an.
import 'server-only'
import {
  loadAiConfig,
  type AiConfigError,
} from '@/features/ai-settings/application/ai-config-service'
import { findLastCaptureMethod } from '../data/last-capture-method'
import type { CaptureMethod } from '../domain/stock-draft'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'

type WayDeps = Pick<CaptureDeps, 'db' | 'env'>

/**
 * Warum die Foto-Erkennung nicht hilft (KI aus, nicht eingerichtet …), null wenn sie bereit ist.
 * Der Foto-Weg sagt es dann gleich zu Beginn, statt jedes Foto vergeblich lesen zu lassen (#210).
 */
export async function findRecognitionOffReason(
  deps: WayDeps,
  actor: CaptureActor,
): Promise<AiConfigError['kind'] | null> {
  const config = await loadAiConfig(deps, actor.householdId)
  const role = config.forRole('verpackung')
  return role.ok ? null : role.error.kind
}

export async function chooseCaptureWay(deps: WayDeps, actor: CaptureActor): Promise<CaptureMethod> {
  const last = await findLastCaptureMethod(deps.db, actor)
  if (last !== null) return last
  return (await findRecognitionOffReason(deps, actor)) === null ? 'photo' : 'manual'
}
