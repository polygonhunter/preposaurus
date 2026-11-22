import Link from 'next/link'
import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'

type ChipProps = Readonly<{
  children: ReactNode
  isActive?: boolean
  // Mit href ein Link (Sprungmarke, Filter in der Adresse), sonst ein Umschalt-Knopf
  href?: string
  onClick?: () => void
}>

function chipClasses(isActive: boolean): string {
  return cx(
    'touch-target inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-callout whitespace-nowrap transition-colors duration-150 ease-out',
    isActive ? 'bg-fg text-bg' : 'bg-surface text-fg',
  )
}

export function Chip({ children, isActive = false, href, onClick }: ChipProps) {
  if (href !== undefined) {
    return (
      <Link
        href={href}
        aria-current={isActive ? 'true' : undefined}
        className={chipClasses(isActive)}
      >
        {children}
      </Link>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={chipClasses(isActive)}
    >
      {children}
    </button>
  )
}
