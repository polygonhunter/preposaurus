import type { ComponentProps } from 'react'
import { buttonClasses, type ButtonVariant } from './button-styles'

type ButtonProps = Omit<ComponentProps<'button'>, 'className'> &
  Readonly<{
    variant?: ButtonVariant
    // Lädt: Der Knopf sagt in Worten, was gerade passiert („Speichert …“), nicht nur per Kreisel.
    pendingLabel?: string | undefined
    className?: string
  }>

export function Button({
  variant = 'primary',
  pendingLabel,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isPending = pendingLabel !== undefined
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled === true || isPending}
      aria-busy={isPending || undefined}
      className={buttonClasses(variant, className)}
    >
      {isPending ? pendingLabel : children}
    </button>
  )
}
