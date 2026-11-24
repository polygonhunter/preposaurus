import Link from 'next/link'
import { HISTORY_PATH } from './history-paths'

// „Verlauf“ oben rechts im Vorrat (UX-Konzept §8.3: „Verlauf“ → Unterseite, #48).
export function HistoryLink() {
  return (
    <Link
      href={HISTORY_PATH}
      className="touch-target flex items-center rounded-md px-2 text-accent transition-opacity duration-150 ease-out active:opacity-60"
    >
      Verlauf
    </Link>
  )
}
