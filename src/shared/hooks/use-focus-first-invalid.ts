'use client'
import { useEffect, useRef } from 'react'

// Nach einer Antwort mit Fehlern springt der Fokus ins erste ungültige Feld. Sonst landet er auf
// <body>, weil der Absende-Knopf beim Laden kurz gesperrt ist, und Tastatur und Screenreader
// fangen oben wieder an. `errors` ist die Antwort der Action, eine neue Antwort ist ein neues Objekt.
// data-invalid markiert Knöpfe, die ein Feld vertreten (z. B. die Kategorie-Wahl), weil ein Knopf
// kein aria-invalid tragen darf.
export function useFocusFirstInvalid(errors: unknown) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
      ?.focus()
  }, [errors])
  return formRef
}
