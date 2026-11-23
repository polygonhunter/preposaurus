// DTO der Übersicht (#67, UX-Konzept §8.1): schmal, ohne DB-Zeilen, alle Zahlen schon gerechnet.
// Die Oberfläche formatiert nur noch. Datumswerte als ISO-Text (JJJJ-MM-TT).
import { z } from 'zod'

const isoDay = z.iso.date()
const days = z.number().nonnegative()
const count = z.number().int().nonnegative()

/** „Heute versorgt“, null ohne Bedarf (keine Mitglieder oder keine aktive Quelle). */
const supplySchema = z.object({
  /** Kernzahl: der kleinere Wert aus Essen und Wasser, eine Nachkommastelle abgerundet */
  days,
  energyDays: days,
  waterDays: days,
  bottleneck: z.enum(['energy', 'water']),
  /** „ca.“ vor der Kernzahl: Richtwert-Anteil an den kcal ab 10 % */
  isApproximate: z.boolean(),
})

/** Stand am Zieldatum (A3), null ohne Zieldatum oder ohne Bedarf. */
const outlookSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('in-past') }),
  z.object({
    kind: z.literal('valid'),
    days,
    isReached: z.boolean(),
    /** Packungen, die heute zählen und vor dem Zieldatum ablaufen */
    expiringPackages: count,
  }),
])

const goalSchema = z.object({
  days: z.number().int().positive(),
  date: isoDay.nullable(),
  outlook: outlookSchema.nullable(),
})

const shortfallSchema = z.object({
  resource: z.enum(['energy', 'water']),
  /** ml Wasser bzw. kcal */
  missing: z.number().positive(),
})

/** Fehlmenge des Engpasses bis zum Ziel (A4), dazu die des anderen Werts, wenn auch er fehlt. */
const nextStepSchema = shortfallSchema.extend({ alsoMissing: shortfallSchema.nullable() })

const dueGroupSchema = z.enum(['expired', 'this-week', 'this-month', 'next-three-months'])

const dueEntrySchema = z.object({
  name: z.string(),
  packages: count,
  date: isoDay,
  precision: z.enum(['day', 'month', 'year']),
  daysLeft: z.number().int(),
  group: dueGroupSchema,
})

const dueSchema = z.object({
  /** Packungen je Zeitgruppe für die Kennzahlen */
  counts: z.record(dueGroupSchema, count),
  /** Alle fälligen Packungen, für „Alle N“ */
  total: count,
  /** Die dringendsten Einträge, höchstens drei */
  entries: z.array(dueEntrySchema),
  /** Gelb-Schwelle in Tagen, für „Nichts fällig in den nächsten N Tagen“ */
  soonDays: count,
})

/** Abdeckung je Warengruppe (A9), ohne Wasser: das ist der zweite Balken der Hauptkachel. */
const groupCoverageSchema = z.object({
  key: z.string(),
  name: z.string(),
  days,
  goalDays: z.number().int().positive(),
  isTightest: z.boolean(),
})

const restockSchema = z.object({
  /** Offene Einträge der Nachkaufen-Liste */
  openItems: count,
  /** Warengruppen, denen am Stichtag des Ziels noch Menge fehlt (Ziel-Lücke, A13) */
  gapGroups: count,
})

const householdSchema = z.object({
  members: count,
  source: z.object({ name: z.string(), asOf: z.string(), link: z.string() }).nullable(),
})

/** @internal Nur Tests prüfen das DTO gegen das Schema, die Seite nutzt die Typen. */
export const overviewSchema = z.object({
  /** Gibt es überhaupt Packungen im Vorrat? Sonst zeigt die Übersicht den Leerzustand */
  hasStock: z.boolean(),
  supply: supplySchema.nullable(),
  goal: goalSchema.nullable(),
  nextStep: nextStepSchema.nullable(),
  due: dueSchema,
  groups: z.array(groupCoverageSchema),
  restock: restockSchema,
  household: householdSchema,
})

export type Overview = z.infer<typeof overviewSchema>
export type OverviewSupply = z.infer<typeof supplySchema>
export type OverviewGoal = z.infer<typeof goalSchema>
export type OverviewNextStep = z.infer<typeof nextStepSchema>
export type OverviewDue = z.infer<typeof dueSchema>
export type OverviewDueEntry = z.infer<typeof dueEntrySchema>
export type OverviewGroup = z.infer<typeof groupCoverageSchema>
export type OverviewRestock = z.infer<typeof restockSchema>
export type OverviewHousehold = z.infer<typeof householdSchema>
