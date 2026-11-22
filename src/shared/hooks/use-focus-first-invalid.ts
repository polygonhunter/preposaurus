'use client'
import { useEffect, useRef } from 'react'

// Nach einer Antwort mit Fehlern springt der Fokus ins erste ungültige Feld. Sonst landet er auf
// <body>, weil der Absende-Knopf beim Laden kurz gesperrt ist, und Tastatur und Screenreader
// fangen oben wieder an. `errors` ist die Antwort der Action, eine neue Antwort ist ein neues Objekt.
export function useFocusFirstInvalid(errors: unknown) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])
  return formRef
}
