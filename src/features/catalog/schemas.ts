// Schemas der Stammdaten-Seiten (EIN-04): Namen, IDs und die Richtung beim Sortieren. Sie lesen die
// Textfelder der Formulare, der Haushalt kommt nie aus der Eingabe, sondern aus der Sitzung.
import { z } from 'zod'

const NAME_MAX_LENGTH = 40

export const catalogNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte einen Namen eintragen.' })
  .max(NAME_MAX_LENGTH, { error: 'Bitte höchstens 40 Zeichen.' })

export const catalogIdSchema = z.uuid()

export const moveDirectionSchema = z.enum(['up', 'down'])
