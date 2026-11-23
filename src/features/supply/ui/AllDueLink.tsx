import Link from 'next/link'
import { OVERVIEW_PATHS } from './overview-paths'

type AllDueLinkProps = Readonly<{ total: number }>

// „Alle N“ im Gruppenkopf von Bald fällig. Der Rest des Namens steht für Screenreader dabei.
export function AllDueLink({ total }: AllDueLinkProps) {
  return (
    <Link href={OVERVIEW_PATHS.due} className="touch-target text-accent">
      Alle {total}
      <span className="sr-only"> fälligen Packungen ansehen</span>
    </Link>
  )
}
