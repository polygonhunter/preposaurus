'use client'
import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from './Button'
import type { ButtonVariant } from './button-styles'

type FormSubmitButtonProps = Readonly<{
  pendingLabel: string
  variant?: ButtonVariant | undefined
  children: ReactNode
}>

// Absende-Knopf für Formulare mit einer Server Action ohne useActionState: Er liest den Zustand
// des umgebenden Formulars selbst und sagt in Worten, was gerade passiert.
export function FormSubmitButton({
  pendingLabel,
  variant = 'primary',
  children,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} pendingLabel={pending ? pendingLabel : undefined}>
      {children}
    </Button>
  )
}
