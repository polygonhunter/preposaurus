// Ein Mitglied ist eine Person im Haushalt, mit oder ohne Login (02_HAUSHALT_ZIEL §1, HH-01 bis
// HH-04). Die Wertelisten stehen in shared/config/constants.ts, hier nur ihre Typen.
import type { CalendarDay } from '@/shared/lib/dates'
import type {
  ACTIVITY_LEVELS,
  DIETS,
  MEMBER_CONDITIONS,
  MEMBER_TYPES,
  SEXES,
} from '@/shared/config/constants'

export type MemberType = (typeof MEMBER_TYPES)[number]
export type Diet = (typeof DIETS)[number]
export type Sex = (typeof SEXES)[number]
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]
export type MemberCondition = (typeof MEMBER_CONDITIONS)[number]

/** Was zu einer Person gespeichert wird. Leere Felder sind freiwillig. */
export type MemberValues = Readonly<{
  name: string
  type: MemberType
  birthDate: CalendarDay | null
  sex: Sex | null
  activityLevel: ActivityLevel | null
  weightKg: number | null
  condition: MemberCondition | null
  /** Leer heißt: wie der Haushalt */
  diet: Diet | null
  allergies: readonly string[]
}>

export type Member = MemberValues & Readonly<{ id: string }>

/** Ernährungsform, die für die Person gilt: ihre eigene oder die des Haushalts. */
export function effectiveDiet(member: Pick<MemberValues, 'diet'>, householdDiet: Diet): Diet {
  return member.diet ?? householdDiet
}
