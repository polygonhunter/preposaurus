// Welchen Weg der Erfassen-Knopf öffnet (UX §8.5, #79): Ohne bereite Foto-Erkennung immer das
// Formular, sonst den zuletzt genutzten Weg, beim ersten Mal das Foto (pickCaptureWay). Ob die
// Kamera erlaubt ist, weiß nur das Gerät: Ohne Kamera bietet der Foto-Weg selbst „Von Hand
// eintragen“ als Hauptknopf an.
import 'server-only'
import {
  loadAiConfig,
  type AiConfigError,
} from '@/features/ai-settings/application/ai-config-service'
import { findLastCaptureMethod } from '../data/last-capture-method'
import { isPhotoWayReplaced, pickCaptureWay } from '../domain/capture-way'
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

async function readWayFacts(deps: WayDeps, actor: CaptureActor) {
  const [last, offReason] = await Promise.all([
    findLastCaptureMethod(deps.db, actor),
    findRecognitionOffReason(deps, actor),
  ])
  return { facts: { last, isRecognitionReady: offReason === null }, offReason }
}

export async function chooseCaptureWay(deps: WayDeps, actor: CaptureActor): Promise<CaptureMethod> {
  const { facts } = await readWayFacts(deps, actor)
  return pickCaptureWay(facts)
}

/** Grund für den Satz im Formular (#79), null wenn „Neu“ den gewohnten Weg genommen hat. */
export async function findReplacedPhotoWayReason(
  deps: WayDeps,
  actor: CaptureActor,
): Promise<AiConfigError['kind'] | null> {
  const { facts, offReason } = await readWayFacts(deps, actor)
  return isPhotoWayReplaced(facts) ? offReason : null
}
