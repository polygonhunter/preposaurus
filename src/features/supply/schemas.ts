// Schemas des Vorrats: Formular des Ziels und DTO der Übersicht (weiter unten).
// Ziel (ZIEL-03, ZIEL-04): Das Formular schickt die gewählte Dauer („3“, „10“, „14“ oder
// „eigen“), bei „eigen“ den eigenen Wert und ein freiwilliges Datum (JJJJ-MM-TT aus dem Datumsfeld).
import { z } from 'zod'
import { GOAL_DAY_PRESETS, MAX_GOAL_DAYS } from '@/shared/config/constants'
import { parseCalendarDay } from '@/shared/lib/dates'

export const CUSTOM_GOAL_CHOICE = 'eigen'

/** Wo das Ziel-Formular steht: Einstellungen oder Schritt „Ziel“ der Einrichtung (#40) */
export type GoalFormPlace = 'einstellungen' | 'einrichtung'

const DAYS_MESSAGE = `Bitte eine Zahl von 1 bis ${String(MAX_GOAL_DAYS)} eintragen.`
const PRESET_CHOICES = GOAL_DAY_PRESETS.map(String)

const customDaysSchema = z.coerce
  .number({ error: DAYS_MESSAGE })
  .int({ error: DAYS_MESSAGE })
  .min(1, { error: DAYS_MESSAGE })
  .max(MAX_GOAL_DAYS, { error: DAYS_MESSAGE })

const targetDateSchema = z
  .string()
  .trim()
  .transform((text, context) => {
    if (text === '') return null
    const day = parseCalendarDay(text)
    if (day === null)
      context.addIssue({ code: 'custom', message: 'Bitte ein gültiges Datum wählen.' })
    return day
  })

const choiceSchema = z
  .string()
  .refine((choice) => choice === CUSTOM_GOAL_CHOICE || PRESET_CHOICES.includes(choice), {
    error: 'Bitte eine Dauer wählen.',
  })

export const goalSchema = z
  .object({ choice: choiceSchema, customDays: z.string(), targetDate: targetDateSchema })
  .transform((form, context) => {
    if (form.choice !== CUSTOM_GOAL_CHOICE) {
      return { days: Number(form.choice), targetDate: form.targetDate }
    }
    const custom = customDaysSchema.safeParse(form.customDays)
    if (custom.success) return { days: custom.data, targetDate: form.targetDate }
    context.addIssue({ code: 'custom', path: ['customDays'], message: DAYS_MESSAGE })
    return z.NEVER
  })

export type GoalInput = z.infer<typeof goalSchema>

// DTO der Übersicht (#67, UX-Konzept §8.1): schmal, ohne DB-Zeilen, alle Zahlen schon gerechnet.
// Die Oberfläche formatiert nur noch. Datumswerte als ISO-Text (JJJJ-MM-TT).

const isoDay = z.iso.date()
const days = z.number().nonnegative()
const count = z.number().int().nonnegative()

const amount = z.number().nonnegative()

/** Bedarf einer Personengruppe je Person und Tag (kcal, Wasser in ml) */
const needLineSchema = z.object({
  type: z.enum(['baby', 'child', 'teen', 'adult', 'senior']),
  count,
  kcalPerDay: amount,
  waterMlPerDay: amount,
})

/** Rechenweg für das Erklär-Blatt (#219): Bedarf, Vorrat und was nicht mitzählt. */
const explanationSchema = z.object({
  /** kcal bzw. ml Wasser, die heute zählen */
  kcal: amount,
  waterMl: amount,
  kcalPerDay: amount,
  waterMlPerDay: amount,
  needLines: z.array(needLineSchema),
  /** Personen, die im Bedarf noch nicht zählen (Babys, L20) */
  uncountedMembers: count,
  /** Anteil der kcal aus Richtwerten bzw. Schätzungen, 0 bis 1 */
  estimatedShare: z.number().min(0).max(1),
  packages: z.object({ expired: count, stillGood: count, missingDate: count }),
  /** Haushalts-Einstellung „Noch gut zählt mit“ (#117) */
  stillGoodCounts: z.boolean(),
})

/** „Heute versorgt“, null ohne Bedarf (keine Mitglieder oder keine aktive Quelle). */
const supplySchema = z.object({
  /** Kernzahl: der kleinere Wert aus Essen und Wasser, eine Nachkommastelle abgerundet */
  days,
  energyDays: days,
  waterDays: days,
  bottleneck: z.enum(['energy', 'water']),
  /** „ca.“ vor der Kernzahl: Richtwert-Anteil an den kcal ab 10 % */
  isApproximate: z.boolean(),
  explanation: explanationSchema,
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

const overviewGoalSchema = z.object({
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
  /** Kurzer Anzeigename (#177) */
  shortName: z.string(),
  days,
  goalDays: z.number().int().positive(),
  isTightest: z.boolean(),
  /** Rechenweg für das Erklär-Blatt (#230): Bestand ÷ Zielmenge je Tag = Tage */
  unit: z.enum(['g', 'ml']),
  stock: amount,
  targetPerDay: z.number().positive(),
})

const restockSchema = z.object({
  /** Offene Einträge der Nachkaufen-Liste */
  openItems: count,
  /** Warengruppen, denen am Stichtag des Ziels noch Menge fehlt (Ziel-Lücke, A13) */
  gapGroups: count,
})

const householdSchema = z.object({
  members: count,
  source: z
    .object({ name: z.string(), asOf: z.string(), link: z.string(), isVerified: z.boolean() })
    .nullable(),
})

/** @internal Nur Tests prüfen das DTO gegen das Schema, die Seite nutzt die Typen. */
export const overviewSchema = z.object({
  /** Gibt es überhaupt Packungen im Vorrat? Sonst zeigt die Übersicht den Leerzustand */
  hasStock: z.boolean(),
  supply: supplySchema.nullable(),
  goal: overviewGoalSchema.nullable(),
  nextStep: nextStepSchema.nullable(),
  due: dueSchema,
  groups: z.array(groupCoverageSchema),
  restock: restockSchema,
  household: householdSchema,
})

export type Overview = z.infer<typeof overviewSchema>
export type OverviewSupply = z.infer<typeof supplySchema>
export type OverviewGoal = z.infer<typeof overviewGoalSchema>
export type OverviewNextStep = z.infer<typeof nextStepSchema>
export type OverviewDue = z.infer<typeof dueSchema>
export type OverviewDueEntry = z.infer<typeof dueEntrySchema>
export type OverviewGroup = z.infer<typeof groupCoverageSchema>
export type OverviewRestock = z.infer<typeof restockSchema>
export type OverviewHousehold = z.infer<typeof householdSchema>
export type OverviewExplanation = z.infer<typeof explanationSchema>
export type OverviewNeedLine = z.infer<typeof needLineSchema>
