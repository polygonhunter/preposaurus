import { describe, expect, it } from 'vitest'
import { generateTemporaryPassword } from './temporary-password'

describe('generateTemporaryPassword', () => {
  it('baut fünf Gruppen aus je vier Zeichen ohne verwechselbare Zeichen', () => {
    let next = 0
    const password = generateTemporaryPassword((size) => next++ % size)

    expect(password).toBe('abcd-efgh-jkmn-pqrs-tuvw')
    expect(password).toMatch(/^[a-hj-km-np-z2-9]{4}(-[a-hj-km-np-z2-9]{4}){4}$/)
  })

  it('nutzt das ganze Alphabet bis zur letzten Ziffer', () => {
    const password = generateTemporaryPassword((size) => size - 1)

    expect(password).toBe('9999-9999-9999-9999-9999')
  })

  it('ist 24 Zeichen lang und erfüllt damit die Mindestlänge von 10 Zeichen', () => {
    expect(generateTemporaryPassword(() => 0)).toHaveLength(24)
  })
})
