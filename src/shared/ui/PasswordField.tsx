'use client'
import { useState, type ComponentProps } from 'react'
import { Button } from './Button'
import { Field } from './Field'

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, 'type' | 'trailing'>

// Passwortfeld mit Knopf „Anzeigen“ statt eines zweiten Feldes zum Wiederholen (ONBOARDING §2.2).
// Der Knopf ist ein Umschalter (aria-pressed), sein Name bleibt deshalb gleich.
export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Field
      {...props}
      type={isVisible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <Button
          variant="plain"
          className="px-2"
          aria-pressed={isVisible}
          onClick={() => {
            setIsVisible((visible) => !visible)
          }}
        >
          Anzeigen
        </Button>
      }
    />
  )
}
