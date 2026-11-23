import { describe, expect, it } from 'vitest'
import { memberSchema } from '../schemas'

const form = {
  name: ' Kim ',
  type: 'kind',
  birthYear: '2016',
  birthMonth: '',
  sex: '',
  activityLevel: '',
  weightKg: '',
  condition: '',
  diet: '',
  allergies: '',
}

describe('Schema eines Mitglieds', () => {
  it('macht aus leeren Feldern null und kürzt den Namen', () => {
    expect(memberSchema.parse(form)).toEqual({
      name: 'Kim',
      type: 'kind',
      birthYear: 2016,
      birthMonth: null,
      sex: null,
      activityLevel: null,
      weightKg: null,
      condition: null,
      diet: null,
      allergies: [],
    })
  })

  it('meldet fehlende Pflichtangaben am Feld', () => {
    const result = memberSchema.safeParse({ ...form, name: ' ', type: 'katze', birthYear: '' })

    expect(result.success).toBe(false)
    const fields = result.error?.issues.map((issue) => issue.path[0])
    expect(fields).toEqual(expect.arrayContaining(['name', 'type', 'birthYear']))
  })

  it('liest ein Gewicht mit Komma und lehnt Unsinn ab', () => {
    expect(memberSchema.parse({ ...form, weightKg: '61,5' }).weightKg).toBe(61.5)
    expect(memberSchema.safeParse({ ...form, weightKg: 'viel' }).success).toBe(false)
    expect(memberSchema.safeParse({ ...form, weightKg: '0' }).success).toBe(false)
  })

  it('teilt Allergien an Komma, Semikolon und Zeilenende, ohne Doppelte', () => {
    expect(
      memberSchema.parse({ ...form, allergies: 'Gluten; Erdnüsse,\nLaktose, gluten' }).allergies,
    ).toEqual(['Gluten', 'Erdnüsse', 'Laktose'])
  })

  it('begrenzt Länge und Anzahl der Allergien', () => {
    const many = Array.from({ length: 11 }, (_, index) => `Allergie ${String(index)}`).join(', ')

    expect(memberSchema.safeParse({ ...form, allergies: 'x'.repeat(41) }).success).toBe(false)
    expect(memberSchema.safeParse({ ...form, allergies: many }).success).toBe(false)
  })

  it('kennt die Monate 1 bis 12', () => {
    expect(memberSchema.parse({ ...form, birthMonth: '12' }).birthMonth).toBe(12)
    expect(memberSchema.safeParse({ ...form, birthMonth: '13' }).success).toBe(false)
  })
})
