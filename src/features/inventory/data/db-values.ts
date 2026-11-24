// Übersetzt die deutschen Werte der Datenbank in die englischen Typen der Fachlogik
// (CODE_PRINZIPIEN §4, §8: Repositories geben Domain-Typen zurück, nie rohe Zeilen).
import 'server-only'
import type { StoredNutritionSource } from '@/features/inventory/domain/nutrition-source'
import type {
  BestBefore,
  BestBeforePrecision,
  DateKind,
  UnitStatus,
} from '@/features/inventory/domain/unit'
import type { MemberType } from '@/features/supply/domain/daily-need'
import type { Diet } from '@/features/supply/domain/group-targets'
import type {
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  DIETS,
  MEMBER_TYPES,
  NUTRITION_SOURCES,
  UNIT_STATUSES,
} from '@/shared/config/constants'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'

type DbValue<T extends readonly string[]> = T[number]

const UNIT_STATUS: Record<DbValue<typeof UNIT_STATUSES>, UnitStatus> = {
  vorrat: 'stock',
  verbraucht: 'consumed',
  entsorgt: 'discarded',
}

export const DB_UNIT_STATUS: Record<UnitStatus, DbValue<typeof UNIT_STATUSES>> = {
  stock: 'vorrat',
  consumed: 'verbraucht',
  discarded: 'entsorgt',
}

const PRECISION: Record<DbValue<typeof BEST_BEFORE_PRECISIONS>, BestBeforePrecision> = {
  tag: 'day',
  monat: 'month',
  jahr: 'year',
}

/** Genauigkeit zurück in den Wert der Datenbank, z. B. für „Datum ändern“ (#49). */
export const DB_PRECISION: Record<BestBeforePrecision, DbValue<typeof BEST_BEFORE_PRECISIONS>> = {
  day: 'tag',
  month: 'monat',
  year: 'jahr',
}

const DATE_KIND: Record<DbValue<typeof BEST_BEFORE_KINDS>, DateKind> = {
  mhd: 'best-before',
  verbrauchen_bis: 'use-by',
}

const NUTRITION_SOURCE: Record<DbValue<typeof NUTRITION_SOURCES>, StoredNutritionSource> = {
  tabelle: 'label',
  manuell: 'manual',
  ki_schaetzung: 'ai-estimate',
}

const DIET: Record<DbValue<typeof DIETS>, Diet> = {
  alles: 'omnivore',
  vegetarisch: 'vegetarian',
  vegan: 'vegan',
}

const MEMBER_TYPE: Record<DbValue<typeof MEMBER_TYPES>, MemberType> = {
  baby: 'baby',
  kind: 'child',
  jugendlich: 'teen',
  erwachsen: 'adult',
  senior: 'senior',
}

export const toUnitStatus = (value: DbValue<typeof UNIT_STATUSES>) => UNIT_STATUS[value]
export const toDateKind = (value: DbValue<typeof BEST_BEFORE_KINDS>) => DATE_KIND[value]
export const toDiet = (value: DbValue<typeof DIETS>) => DIET[value]
export const toMemberType = (value: DbValue<typeof MEMBER_TYPES>) => MEMBER_TYPE[value]

export function toNutritionSource(
  value: DbValue<typeof NUTRITION_SOURCES> | null,
): StoredNutritionSource | null {
  return value === null ? null : NUTRITION_SOURCE[value]
}

/** numeric kommt als Text aus dem Treiber. Leer bleibt null. */
export function toNumberOrNull(value: string | null): number | null {
  return value === null ? null : Number(value)
}

export function toDayOrNull(value: string | null): CalendarDay | null {
  return value === null ? null : toCalendarDay(value)
}

export interface BestBeforeColumns {
  bestBefore: string | null
  precision: DbValue<typeof BEST_BEFORE_PRECISIONS> | null
  isEstimated: boolean
}

/** MHD mit Genauigkeit. Der CHECK hält Datum und Genauigkeit gemeinsam leer oder gesetzt. */
export function toBestBefore({
  bestBefore,
  precision,
  isEstimated,
}: BestBeforeColumns): BestBefore | null {
  if (bestBefore === null) return null
  return { date: toCalendarDay(bestBefore), precision: PRECISION[precision ?? 'tag'], isEstimated }
}
