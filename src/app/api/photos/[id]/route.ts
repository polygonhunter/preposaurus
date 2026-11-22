// Foto ausliefern (UMSETZUNG M6-02): `?variante=vorschau` für das Vorschaubild. Nur der eigene
// Haushalt bzw. Entwurf, alles andere ergibt 404. Ein Foto ändert sich unter seiner ID nie,
// deshalb darf der Browser es lange behalten, aber nur er (private), kein Proxy dazwischen.
import { requireCaptureActor } from '@/features/capture/application/capture-actor'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { readPhoto, type PhotoContent } from '@/features/capture/application/read-photo'
import { photoRequestSchema } from '@/features/capture/schemas/photos'
import { errorResponse } from '@/shared/lib/http'
import { accessErrorResponse } from '../access-error-response'

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60
const NOT_FOUND = 'Dieses Foto gibt es nicht.'

function photoResponse({ data, mimeType }: PhotoContent): Response {
  return new Response(new Uint8Array(data), {
    headers: {
      'content-type': mimeType,
      'content-length': String(data.byteLength),
      'cache-control': `private, max-age=${String(ONE_WEEK_SECONDS)}, immutable`,
      'content-disposition': 'inline',
      // Nie als etwas anderes deuten, nie in fremde Seiten einbetten, nichts ausführen.
      'x-content-type-options': 'nosniff',
      'cross-origin-resource-policy': 'same-origin',
      'content-security-policy': "default-src 'none'; sandbox",
    },
  })
}

// Kontext von Hand typisiert: Das globale RouteContext entsteht erst mit `next typegen`, ESLint
// läuft in der CI ohne diesen Schritt.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireCaptureActor()
  if (!actor.ok) return accessErrorResponse(actor.error)
  const { id } = await context.params
  const variante = new URL(request.url).searchParams.get('variante') ?? undefined
  const parsed = photoRequestSchema.safeParse({ id, variante })
  if (!parsed.success) return errorResponse(404, NOT_FOUND)
  const { db, storage } = await loadCaptureDeps()
  const result = await readPhoto(
    { db, storage },
    { actor: actor.value, photoId: parsed.data.id, variant: parsed.data.variante },
  )
  return result.ok ? photoResponse(result.value) : errorResponse(404, NOT_FOUND)
}
