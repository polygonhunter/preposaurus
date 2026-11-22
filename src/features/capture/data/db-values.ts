// Übersetzt die englischen Typen der Fachlogik in die deutschen Werte der Datenbank
// (CODE_PRINZIPIEN §4). Die Gegenrichtung für das Lesen steht in inventory/data/db-values.ts.
import 'server-only'
import type { StoredNutritionSource } from '@/features/inventory/domain/nutrition-source'
import type { BestBeforePrecision, DateKind } from '@/features/inventory/domain/unit'
import type {
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  CAPTURE_METHODS,
  NUTRITION_SOURCES,
} from '@/shared/config/constants'
import type { CaptureMethod } from '../domain/stock-draft'

type DbValue<T extends readonly string[]> = T[number]

export const DB_CAPTURE_METHOD: Record<CaptureMethod, DbValue<typeof CAPTURE_METHODS>> = {
  photo: 'foto',
  manual: 'manuell',
}

export const DB_PRECISION: Record<BestBeforePrecision, DbValue<typeof BEST_BEFORE_PRECISIONS>> = {
  day: 'tag',
  month: 'monat',
  year: 'jahr',
}

export const DB_DATE_KIND: Record<DateKind, DbValue<typeof BEST_BEFORE_KINDS>> = {
  'best-before': 'mhd',
  'use-by': 'verbrauchen_bis',
}

export const DB_NUTRITION_SOURCE: Record<
  StoredNutritionSource,
  DbValue<typeof NUTRITION_SOURCES>
> = {
  label: 'tabelle',
  manual: 'manuell',
  'ai-estimate': 'ki_schaetzung',
}

/** numeric erwartet Text. Leer bleibt null. */
export const toNumeric = (value: number | null) => (value === null ? null : String(value))
