import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClasses, type ButtonVariant } from './button-styles'

type ButtonLinkProps = Readonly<{
  href: string
  variant?: ButtonVariant
  className?: string
  children: ReactNode
}>

// Sieht aus wie ein Button, führt aber zu einer Seite.
export function ButtonLink({ href, variant = 'primary', className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  )
}
