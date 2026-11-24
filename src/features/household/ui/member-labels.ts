// Deutsche Bezeichnungen der Wertelisten eines Mitglieds (02_HAUSHALT_ZIEL §1). Eine Stelle für
// Formular, Liste und Lesesicht.
import {
  effectiveDiet,
  type ActivityLevel,
  type Diet,
  type Member,
  type MemberCondition,
  type MemberType,
  type Sex,
} from '../domain/member'
import { birthFromDate } from '../domain/birth'

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  erwachsen: 'Erwachsene:r',
  kind: 'Kind (bis 12)',
  jugendlich: 'Jugendliche:r',
  senior: 'Senior:in',
  baby: 'Baby',
}

export const DIET_LABELS: Record<Diet, string> = {
  alles: 'Alles',
  vegetarisch: 'Vegetarisch',
  vegan: 'Vegan',
}

export const SEX_LABELS: Record<Sex, string> = {
  weiblich: 'Weiblich',
  maennlich: 'Männlich',
  divers: 'Divers',
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  wenig: 'Wenig',
  normal: 'Normal',
  viel: 'Viel',
}

export const CONDITION_LABELS: Record<MemberCondition, string> = {
  schwanger: 'Schwanger',
  stillend: 'Stillend',
}

/** Werte als Auswahl für Segmented und RadioChips, in der Reihenfolge der Liste */
export function optionsOf<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

/** „03/2026“ bei Babys, sonst „1988“. Ohne Angabe leer. */
function formatBirth(member: Pick<Member, 'birthDate' | 'type'>): string | null {
  if (member.birthDate === null) return null
  const { year, month } = birthFromDate(member.birthDate, member.type)
  return month === null ? String(year) : `${String(month).padStart(2, '0')}/${String(year)}`
}

// „alles“ ist der Normalfall und steht deshalb nicht in der Zweitzeile.
const DIET_IN_SUMMARY: Record<Diet, string | null> = {
  alles: null,
  vegetarisch: 'vegetarisch',
  vegan: 'vegan',
}

/** Zweitzeile in der Liste: „Erwachsene:r · 1988 · vegan“ */
export function memberSummary(member: Member, householdDiet: Diet): string {
  const diet = DIET_IN_SUMMARY[effectiveDiet(member, householdDiet)]
  const parts = [MEMBER_TYPE_LABELS[member.type], formatBirth(member), diet]
  return parts.filter((part) => part !== null).join(' · ')
}
