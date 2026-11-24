// Welchen Weg der Erfassen-Knopf öffnet (UX §8.5, #79). Zuerst zählt, ob die Foto-Erkennung hilft:
// Ist sie aus oder nicht eingerichtet, startet „Neu“ immer im Formular, auch wenn zuletzt per Foto
// erfasst wurde. Sonst der zuletzt genutzte Weg, beim ersten Mal das Foto.
import type { CaptureMethod } from './stock-draft'

export interface CaptureWayFacts {
  /** Weg der letzten Erfassung des Nutzers, null beim ersten Mal */
  last: CaptureMethod | null
  isRecognitionReady: boolean
}

export function pickCaptureWay({ last, isRecognitionReady }: CaptureWayFacts): CaptureMethod {
  if (!isRecognitionReady) return 'manual'
  return last ?? 'photo'
}

/**
 * Das Formular sagt kurz, warum es statt der Kamera kommt: nur wenn der gewohnte Weg das Foto war.
 * Wer ohnehin von Hand erfasst, braucht den Satz nicht bei jedem Öffnen.
 */
export const isPhotoWayReplaced = ({ last, isRecognitionReady }: CaptureWayFacts) =>
  !isRecognitionReady && last === 'photo'
