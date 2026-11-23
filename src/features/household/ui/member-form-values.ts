// Startwerte des Mitglieder-Formulars als Text, so wie die Felder sie zeigen. Nach einem Fehler
// kommen dieselben Texte aus der Action zurück, damit nichts verloren geht.
import { birthFromDate } from '../domain/birth'
import type { Member } from '../domain/member'

export type MemberFormValues = Readonly<{
  name: string
  type: string
  birthYear: string
  birthMonth: string
  sex: string
  activityLevel: string
  weightKg: string
  condition: string
  diet: string
  allergies: string
}>

export const NEW_MEMBER_VALUES: MemberFormValues = {
  name: '',
  type: 'erwachsen',
  birthYear: '',
  birthMonth: '',
  sex: '',
  activityLevel: '',
  weightKg: '',
  condition: '',
  diet: '',
  allergies: '',
}

const textOf = (value: string | number | null) => (value === null ? '' : String(value))

export function formValuesOf(member: Member): MemberFormValues {
  const birth = member.birthDate === null ? null : birthFromDate(member.birthDate, member.type)
  return {
    name: member.name,
    type: member.type,
    birthYear: textOf(birth?.year ?? null),
    birthMonth: textOf(birth?.month ?? null),
    sex: textOf(member.sex),
    activityLevel: textOf(member.activityLevel),
    weightKg: member.weightKg === null ? '' : String(member.weightKg).replace('.', ','),
    condition: textOf(member.condition),
    diet: textOf(member.diet),
    allergies: member.allergies.join(', '),
  }
}
