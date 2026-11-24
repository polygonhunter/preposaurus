import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { foodTypeFormSchema } from '../schemas'

const CATEGORY_ID = '0b9f7f1e-5c3a-4e1f-9a7d-2f3c4b5a6d7e'

const form = (extra: Record<string, string> = {}) => ({
  name: 'Dinkelreis',
  categoryId: CATEGORY_ID,
  searchTerms: '',
  kcalPer100: '',
  proteinPer100: '',
  carbsPer100: '',
  fatPer100: '',
  typicalShelfLifeMonths: '',
  ...extra,
})

const errorsOf = (extra: Record<string, string>) => {
  const parsed = foodTypeFormSchema.safeParse(form(extra))
  return parsed.success ? {} : z.flattenError(parsed.error).fieldErrors
}

describe('Formular einer eigenen Lebensmittelart', () => {
  it('lässt alle Richtwerte leer', () => {
    expect(foodTypeFormSchema.parse(form())).toMatchObject({
      kcalPer100: null,
      proteinPer100: null,
      carbsPer100: null,
      fatPer100: null,
      typicalShelfLifeMonths: null,
    })
  })

  it('liest Makros mit Komma oder Punkt und die Haltbarkeit in Monaten', () => {
    const parsed = foodTypeFormSchema.parse(
      form({
        kcalPer100: '352',
        proteinPer100: '11,5',
        carbsPer100: ' 68 ',
        fatPer100: '2.5',
        typicalShelfLifeMonths: '18',
      }),
    )

    expect(parsed).toMatchObject({
      kcalPer100: 352,
      proteinPer100: 11.5,
      carbsPer100: 68,
      fatPer100: 2.5,
      typicalShelfLifeMonths: 18,
    })
  })

  it('erlaubt je Makro höchstens 100 g, weil mehr nicht in 100 g passt', () => {
    expect(errorsOf({ fatPer100: '100' })).toEqual({})
    expect(errorsOf({ fatPer100: '100,1' })).toEqual({
      fatPer100: ['Bitte die Gramm als Zahl von 0 bis 100 eintragen.'],
    })
    expect(errorsOf({ proteinPer100: '-1', carbsPer100: 'viel' })).toEqual({
      proteinPer100: ['Bitte die Gramm als Zahl von 0 bis 100 eintragen.'],
      carbsPer100: ['Bitte die Gramm als Zahl von 0 bis 100 eintragen.'],
    })
  })

  it('verlangt die Haltbarkeit als ganze Monate von 1 bis 360', () => {
    const message = ['Bitte die Monate als ganze Zahl von 1 bis 360 eintragen.']

    expect(errorsOf({ typicalShelfLifeMonths: '360' })).toEqual({})
    expect(errorsOf({ typicalShelfLifeMonths: '0' })).toEqual({ typicalShelfLifeMonths: message })
    expect(errorsOf({ typicalShelfLifeMonths: '361' })).toEqual({ typicalShelfLifeMonths: message })
    expect(errorsOf({ typicalShelfLifeMonths: '1,5' })).toEqual({ typicalShelfLifeMonths: message })
  })

  it('behält die Grenze für kcal bei 900', () => {
    expect(errorsOf({ kcalPer100: '900' })).toEqual({})
    expect(errorsOf({ kcalPer100: '901' })).toEqual({
      kcalPer100: ['Bitte die kcal als Zahl von 0 bis 900 eintragen.'],
    })
  })
})
