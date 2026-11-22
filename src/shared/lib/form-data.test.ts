import { describe, expect, it } from 'vitest'
import { firstMessages, readFormText } from './form-data'

describe('readFormText', () => {
  it('liest Text und behandelt fehlende Felder und Dateien als leer', () => {
    const formData = new FormData()
    formData.set('name', 'Sam')
    formData.set('foto', new Blob(['x']), 'foto.jpg')

    expect(readFormText(formData, 'name')).toBe('Sam')
    expect(readFormText(formData, 'fehlt')).toBe('')
    expect(readFormText(formData, 'foto')).toBe('')
  })
})

describe('firstMessages', () => {
  it('nimmt je Feld die erste Meldung und lässt leere Felder weg', () => {
    expect(firstMessages({ name: ['zu kurz', 'zu lang'], passwort: [] })).toEqual({
      name: 'zu kurz',
    })
  })
})
