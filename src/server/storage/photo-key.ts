// Schlüssel einer Fotodatei: ein Pfad relativ zum Basisordner des Foto-Volumes. Nur was diese
// Prüfung besteht, erreicht einen Adapter. So kann kein Schlüssel aus dem Basisordner hinaus
// zeigen (Path Traversal), auch wenn er aus einer DB-Zeile oder einer Anfrage stammt.

declare const photoKeyBrand: unique symbol

export type PhotoKey = string & { readonly [photoKeyBrand]: true }

/** Ein Abschnitt beginnt mit Buchstabe oder Ziffer. So sind `.`, `..` und versteckte Dateien ausgeschlossen. */
const SEGMENT = /^[a-z0-9][a-z0-9_.-]*$/i
const MAX_KEY_LENGTH = 200
const MAX_SEGMENTS = 4

const isSafeSegment = (segment: string) => SEGMENT.test(segment)

/** Prüft einen Schlüssel wie `haushalt-id/foto-id-full.jpg`. Alles andere ergibt null. */
export function parsePhotoKey(text: string): PhotoKey | null {
  if (text.length === 0 || text.length > MAX_KEY_LENGTH) return null
  const segments = text.split('/')
  if (segments.length > MAX_SEGMENTS || !segments.every(isSafeSegment)) return null
  return text as PhotoKey
}

/** Verkleinertes Foto oder Vorschaubild. */
type PhotoVariant = 'full' | 'thumbnail'

interface PhotoKeyParts {
  householdId: string
  photoId: string
  variant: PhotoVariant
}

/** Baut den Schlüssel für ein Foto. Ungeeignete IDs ergeben null statt eines unsicheren Pfads. */
export function buildPhotoKey({ householdId, photoId, variant }: PhotoKeyParts): PhotoKey | null {
  if (!isSafeSegment(householdId) || !isSafeSegment(photoId)) return null
  return parsePhotoKey(`${householdId}/${photoId}-${variant}.jpg`)
}
