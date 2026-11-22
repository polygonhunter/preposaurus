import Link from 'next/link'
import type { FoodTypeDetail } from '../schemas'
import { categoryAnchor, groupPath } from './stock-paths'

type PathLineProps = Readonly<{ path: FoodTypeDetail['path'] }>

// Pfadzeile statt Baum (UX-Konzept §2): „Getreide › Nudeln“, jeder Teil ist antippbar.
export function PathLine({ path }: PathLineProps) {
  const groupHref = groupPath(path.group.key)
  return (
    <nav aria-label="Pfad">
      <ol className="flex flex-wrap items-center gap-x-1">
        <li>
          <Link href={groupHref} className="inline-flex min-h-6 items-center text-accent">
            {path.group.name}
          </Link>
        </li>
        <li className="flex gap-x-1">
          <span aria-hidden="true">›</span>
          <Link
            href={`${groupHref}#${categoryAnchor(path.category.id)}`}
            className="inline-flex min-h-6 items-center text-accent"
          >
            {path.category.name}
          </Link>
        </li>
      </ol>
    </nav>
  )
}
