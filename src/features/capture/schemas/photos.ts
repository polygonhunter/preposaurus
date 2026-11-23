// Eingaben der Foto-Routen (#56, #60): Upload, Ausliefern und Erkennung auslösen.
import { z } from 'zod'
import { PHOTO_ROLES } from '@/shared/config/constants'

/** Query von `POST /api/photos?rolle=…&entwurf=…`. Der Body ist das rohe Bild. */
export const photoUploadQuerySchema = z.object({
  rolle: z.enum(PHOTO_ROLES),
  entwurf: z.uuid().optional(),
})

/** `GET /api/photos/[id]?variante=vorschau`. Ohne Variante kommt das verkleinerte Bild. */
export const photoRequestSchema = z.object({
  id: z.uuid(),
  variante: z
    .enum(['bild', 'vorschau'])
    .default('bild')
    .transform((variant) => (variant === 'vorschau' ? 'thumbnail' : 'full')),
})

/** Body von `POST /api/recognize`. Nur Lesen, Schätzungen laufen getrennt (#124). */
export const recognizeRequestSchema = z.strictObject({ fotoId: z.uuid() })
