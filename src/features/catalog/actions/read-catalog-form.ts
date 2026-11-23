// Liest und prüft die Felder der Stammdaten-Formulare an der Grenze (CODE_PRINZIPIEN §7).
import { z } from 'zod'
import { readFormText } from '@/shared/lib/form-data'
import type { MoveDirection } from '../domain/sort-order'
import { catalogIdSchema, catalogNameSchema, moveDirectionSchema } from '../schemas'

type ParsedName = Readonly<{ ok: true; name: string }> | Readonly<{ ok: false; error: string }>

export function readName(formData: FormData): ParsedName {
  const parsed = catalogNameSchema.safeParse(readFormText(formData, 'name'))
  if (parsed.success) return { ok: true, name: parsed.data }
  const [message] = z.flattenError(parsed.error).formErrors
  return { ok: false, error: message ?? 'Bitte einen Namen eintragen.' }
}

export function readId(formData: FormData): string | null {
  const parsed = catalogIdSchema.safeParse(readFormText(formData, 'id'))
  return parsed.success ? parsed.data : null
}

export function readDirection(formData: FormData): MoveDirection | null {
  const parsed = moveDirectionSchema.safeParse(readFormText(formData, 'richtung'))
  return parsed.success ? parsed.data : null
}

/** Ausblenden-Knöpfe schicken „ja“ zum Ausblenden und „nein“ zum Einblenden. */
export const readHidden = (formData: FormData) => readFormText(formData, 'ausblenden') === 'ja'
