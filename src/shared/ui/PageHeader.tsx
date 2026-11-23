import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

type BackLink = Readonly<{ href: string; label: string }>

type PageHeaderProps = Readonly<{
  title: string
  subtitle?: string
  back?: BackLink
  // Rechts in der Navigationszeile, z. B. das Zahnrad zu den Einstellungen.
  action?: ReactNode
  // Über dem Titel, z. B. die Pfadzeile „Getreide › Nudeln“ im Vorrat
  eyebrow?: ReactNode
  // Überschrift als h2, wenn die Seite daneben schon ein h1 hat (Liste der Einstellungen ab „breit“)
  level?: 1 | 2
}>

export function PageHeader({ title, subtitle, back, action, eyebrow, level = 1 }: PageHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="flex h-11 items-center justify-between px-2 text-body text-accent">
        {back ? (
          <Link
            href={back.href}
            className="touch-target flex items-center gap-0.5 rounded-md pr-2 text-accent"
          >
            <Icon name="back" />
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        {action}
      </div>
      {eyebrow ? <div className="px-4 text-footnote text-fg2 breit:px-6">{eyebrow}</div> : null}
      <Heading className="px-4 text-title tracking-[0.01em] breit:px-6">{title}</Heading>
      {subtitle ? <p className="px-4 pt-0.5 text-callout text-fg2 breit:px-6">{subtitle}</p> : null}
    </header>
  )
}
