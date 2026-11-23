// Vorbelegung des Erfassens aus der Adresse (#195): `?art=<id>` bzw. `?produkt=<id>`. Die Werte
// kommen ungeprüft aus der URL. Was keine UUID ist, fällt weg. Ob Art bzw. Produkt zum Haushalt
// gehören, entscheidet danach `resolvePrefill` gegen die Auswahllisten des Haushalts.
import { z } from 'zod'
import { CAPTURE_PREFILL_PARAMS } from '@/shared/config/stock-paths'

type SearchParams = Readonly<Record<string, string | string[] | undefined>>

const idParam = z.uuid().optional().catch(undefined)

const prefillParamsSchema = z.object({
  foodTypeId: idParam,
  productId: idParam,
})

export type PrefillRequest = z.infer<typeof prefillParamsSchema>

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export function readPrefillParams(params: SearchParams): PrefillRequest {
  return prefillParamsSchema.parse({
    foodTypeId: firstValue(params[CAPTURE_PREFILL_PARAMS['food-type']]),
    productId: firstValue(params[CAPTURE_PREFILL_PARAMS.product]),
  })
}
