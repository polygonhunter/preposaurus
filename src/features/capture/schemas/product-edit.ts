// Produkt bearbeiten (#49, VOR-04): dieselben Bausteine wie beim Erfassen (Inhalt, Nährwerte je
// 100, Grenzen der Spalten). `updateProductSchema` prüft die Action, `productEditFormSchema` das
// Formular auf dem Gerät und liefert genau diese Eingabe. Die Kategorie folgt aus der Art (#110).
import { z } from 'zod'
import { contentText, per100Text } from './manual-capture'
import { contentSchema, MAX_NAME_LENGTH, per100 } from './stock'

const id = z.uuid()

export const updateProductSchema = z.object({
  productId: id,
  foodTypeId: id,
  /** Leer: Es gilt der Name der Lebensmittelart */
  name: z.string().trim().max(MAX_NAME_LENGTH).nullable(),
  content: contentSchema,
  containerId: id.nullable(),
  storageLocationId: id.nullable(),
  nutrition: z.object({ kcal: per100, protein: per100, carbs: per100, fat: per100 }),
  /** „Schätzung bestätigen“, zählt nur bei einer unbestätigten KI-Schätzung (#115) */
  confirmEstimate: z.boolean(),
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>

const nameText = z
  .string()
  .trim()
  .max(MAX_NAME_LENGTH, `Höchstens ${String(MAX_NAME_LENGTH)} Zeichen.`)
  .transform((name) => (name === '' ? null : name))

/** Rohwerte des Formulars → Eingabe der Action, mit Meldungen je Feld. */
export const productEditFormSchema = z
  .object({
    productId: id,
    name: nameText,
    foodTypeId: z.uuid({ error: 'Bitte wählt eine Lebensmittelart.' }),
    content: contentText,
    containerId: id.nullable(),
    storageLocationId: id.nullable(),
    nutrition: z.object({
      kcal: per100Text,
      protein: per100Text,
      carbs: per100Text,
      fat: per100Text,
    }),
    confirmEstimate: z.boolean(),
  })
  .pipe(updateProductSchema)
