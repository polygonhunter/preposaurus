import type { ReactNode } from 'react'
import { ButtonLink } from './ButtonLink'

type EmptyAction = Readonly<{ href: string; label: string }>

type EmptyStateProps = Readonly<{
  // Ein Satz, was hier stehen wird
  text: string
  // Genau eine Handlung für den nächsten Schritt
  action?: EmptyAction
  // Statt des Links eine eigene Handlung, z. B. der Knopf „Neu laden“ der Fehlerseite
  children?: ReactNode
}>

export function EmptyState({ text, action, children }: EmptyStateProps) {
  return (
    <div className="mx-4 flex flex-col items-center gap-4 px-4 py-12 text-center breit:mx-6">
      <p className="max-w-sm text-body text-fg2">{text}</p>
      {action ? (
        <ButtonLink href={action.href} variant="tinted">
          {action.label}
        </ButtonLink>
      ) : null}
      {children}
    </div>
  )
}
