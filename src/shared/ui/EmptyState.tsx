import { ButtonLink } from './ButtonLink'

type EmptyAction = Readonly<{ href: string; label: string }>

type EmptyStateProps = Readonly<{
  // Ein Satz, was hier stehen wird
  text: string
  // Genau eine Handlung für den nächsten Schritt
  action?: EmptyAction
}>

export function EmptyState({ text, action }: EmptyStateProps) {
  return (
    <div className="mx-4 flex flex-col items-center gap-4 px-4 py-12 text-center breit:mx-6">
      <p className="max-w-sm text-body text-fg2">{text}</p>
      {action ? (
        <ButtonLink href={action.href} variant="tinted">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  )
}
