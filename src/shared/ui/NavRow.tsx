'use client'
import { usePathname } from 'next/navigation'
import { isActivePath } from '@/shared/lib/paths'
import { Row } from './Row'
import type { RowContentProps } from './RowContent'

type NavRowProps = RowContentProps &
  Readonly<{
    href: string
    /** Weitere Adressen, auf denen die Zeile als gewählt gilt (z. B. Unterseiten eines Bereichs) */
    alsoCurrentOn?: readonly string[]
  }>

// Zeile einer Liste neben ihrem Inhalt (Einstellungen ab „breit“): Sie gilt als gewählt, solange die
// Adresse in ihrem Bereich liegt, getönt und mit aria-current. Die Auswahl ist die Adresse.
export function NavRow({ href, alsoCurrentOn = [], ...content }: NavRowProps) {
  const pathname = usePathname()
  const isCurrent = [href, ...alsoCurrentOn].some((path) => isActivePath(pathname, path))
  return <Row {...content} action={{ href, isCurrent }} />
}
