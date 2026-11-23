// Aufrufe der Foto-Routen aus dem Browser (#56, #60): Upload als rohes Bild, Erkennung je Foto.
// Netzfehler und 5xx werfen, damit die Warteschlange es wiederholt. Ein 4xx ist endgültig (falscher
// Dateityp, zu groß, Entwurf weg) und kommt als ruhiger Satz zurück.
import type { PhotoRole } from '@/shared/config/constants'
import type { BestBeforeReading } from '../domain/map-best-before-recognition'
import type { NutritionSuggestion, PackagingSuggestion } from '../domain/map-recognition'

export type UploadOutcome =
  { ok: true; photoId: string; draftId: string } | { ok: false; message: string }

type RecognitionSuggestion =
  | { role: 'verpackung'; packaging: PackagingSuggestion }
  | { role: 'naehrwerte'; nutrition: NutritionSuggestion }
  | { role: 'mhd'; bestBefore: BestBeforeReading; conflictingDate: string | null }

/** `unavailable`: KI aus oder nicht eingerichtet (503), dann gar nicht erst wieder fragen. */
export type RecognitionOutcome =
  | { ok: true; suggestion: RecognitionSuggestion }
  | { ok: false; kind: 'unavailable' | 'failed'; message: string }

const UPLOAD_FAILED = 'Das Foto ließ sich nicht hochladen.'
const OFFLINE =
  'Die Erkennung ist gerade nicht erreichbar. Du kannst die Angaben von Hand eintragen.'

async function messageOf(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { fehler?: unknown }
    return typeof body.fehler === 'string' ? body.fehler : fallback
  } catch {
    // Kein JSON (z. B. Proxy-Fehlerseite): der allgemeine Satz reicht.
    return fallback
  }
}

export async function uploadPhoto(
  file: Blob,
  role: PhotoRole,
  draftId: string | null,
): Promise<UploadOutcome> {
  const query = new URLSearchParams({ rolle: role })
  if (draftId !== null) query.set('entwurf', draftId)
  const response = await fetch(`/api/photos?${query.toString()}`, { method: 'POST', body: file })
  if (response.status >= 500) throw new Error(`Upload ${String(response.status)}`)
  if (!response.ok) return { ok: false, message: await messageOf(response, UPLOAD_FAILED) }
  const body = (await response.json()) as { fotoId: string; entwurfId: string }
  return { ok: true, photoId: body.fotoId, draftId: body.entwurfId }
}

export async function recognizePhoto(photoId: string): Promise<RecognitionOutcome> {
  let response: Response
  try {
    response = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fotoId: photoId }),
    })
  } catch {
    // Netz weg: wie ein Fehlschlag, die Maske bietet „Nochmal“ und „Von Hand weiter“.
    return { ok: false, kind: 'failed', message: OFFLINE }
  }
  if (response.ok) return { ok: true, suggestion: (await response.json()) as RecognitionSuggestion }
  const kind = response.status === 503 ? 'unavailable' : 'failed'
  return { ok: false, kind, message: await messageOf(response, OFFLINE) }
}
