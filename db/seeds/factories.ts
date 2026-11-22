// Fabriken (UMSETZUNG M1-10): erzeugen einfügefertige Zeilen mit sinnvollen Standardwerten.
// Die Demo (db/seeds/demo.ts) und die Tests nutzen dieselben Fabriken, damit beide gleich aussehen.
// Sie liegen hier und nicht unter tests/helpers, damit kein Seed aus dem Testordner importiert.
// Nur erfundene Personen, keine echten Haushaltsdaten.
import { randomUUID } from 'node:crypto'
import type { users } from '../../src/server/db/schema/account'
import type { storageLocations } from '../../src/server/db/schema/catalog'
import type { captures } from '../../src/server/db/schema/confirmed-captures'
import type { householdSettings, households, members } from '../../src/server/db/schema/household'
import type { products, units } from '../../src/server/db/schema/inventory'
import type { goals } from '../../src/server/db/schema/recommendation'
import type { restockItems } from '../../src/server/db/schema/restock'

type WithId<T> = T & { id: string }
type Insert<T extends { $inferInsert: unknown }> = T['$inferInsert']

const MS_PER_DAY = 86_400_000

// Datum als YYYY-MM-DD, n Tage nach (oder vor) dem Stichtag, in UTC gerechnet.
export function daysFrom(today: Date, days: number): string {
  return new Date(today.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10)
}

// Tage bis zum MHD je Ampelstufe bei den Standard-Schwellen 90 (gelb) und 28 (orange) Tage.
export const AMPEL_OFFSETS = { gruen: 400, gelb: 60, orange: 10, rot: -3 } as const

// Stufe einer Demo-Einheit: eine Ampelstufe oder „Datum fehlt“ (MHD leer, später nachtragbar).
export type DemoUnitStage = keyof typeof AMPEL_OFFSETS | 'datum_fehlt'

export function bestBeforeFor(stage: DemoUnitStage, today: Date): string | null {
  return stage === 'datum_fehlt' ? null : daysFrom(today, AMPEL_OFFSETS[stage])
}

export function buildHousehold(
  overrides: Partial<Insert<typeof households>> = {},
): WithId<Insert<typeof households>> {
  return { name: 'Beispielhaushalt', ...overrides, id: overrides.id ?? randomUUID() }
}

export function buildHouseholdSettings(
  overrides: Partial<Insert<typeof householdSettings>> & { householdId: string },
): Insert<typeof householdSettings> {
  return { defaultDiet: 'alles', ...overrides }
}

export function buildMember(
  overrides: Partial<Insert<typeof members>> & { householdId: string },
): WithId<Insert<typeof members>> {
  return {
    name: 'Alex',
    type: 'erwachsen',
    ...overrides,
    id: overrides.id ?? randomUUID(),
  }
}

// Technische E-Mail wie in der App: <id>@nutzer.invalid (Better Auth verlangt eine, angezeigt wird sie nie).
export function buildUser(
  overrides: Partial<Insert<typeof users>> = {},
): WithId<Insert<typeof users>> {
  const id = overrides.id ?? randomUUID()
  return {
    name: 'Alex',
    username: `nutzer_${id.slice(0, 8)}`,
    email: `${id}@nutzer.invalid`,
    role: 'mitglied',
    ...overrides,
    id,
  }
}

export function buildGoal(
  overrides: Partial<Insert<typeof goals>> & { householdId: string },
): Insert<typeof goals> {
  return { days: 10, ...overrides }
}

export function buildStorageLocation(
  overrides: Partial<Insert<typeof storageLocations>> & { householdId: string },
): WithId<Insert<typeof storageLocations>> {
  return { name: 'Keller', ...overrides, id: overrides.id ?? randomUUID() }
}

export function buildProduct(
  overrides: Partial<Insert<typeof products>> & { householdId: string; categoryId: string },
): WithId<Insert<typeof products>> {
  return {
    name: 'Nudeln',
    contentAmount: '500',
    contentUnit: 'g',
    kcalPer100: '359',
    nutritionSource: 'tabelle',
    ...overrides,
    id: overrides.id ?? randomUUID(),
  }
}

export function buildCapture(
  overrides: Partial<Insert<typeof captures>> & { householdId: string; userId: string },
): WithId<Insert<typeof captures>> {
  return { method: 'manuell', ...overrides, id: overrides.id ?? randomUUID() }
}

// Mit Datum standardmäßig taggenau, ohne Datum ohne Genauigkeit (CHECK einheit_mhd_genauigkeit_leer_check).
export function buildUnit(
  overrides: Partial<Insert<typeof units>> & { productId: string; captureId: string },
): WithId<Insert<typeof units>> {
  const hasDate = overrides.bestBefore !== undefined && overrides.bestBefore !== null
  return {
    status: 'vorrat',
    bestBeforePrecision: hasDate ? 'tag' : null,
    ...overrides,
    id: overrides.id ?? randomUUID(),
  }
}

export function buildRestockItem(
  overrides: Partial<Insert<typeof restockItems>> & { householdId: string },
): Insert<typeof restockItems> {
  return { label: 'Mineralwasser', source: 'manuell', ...overrides }
}
