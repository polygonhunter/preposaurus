'use client'

import { useRouter } from 'next/navigation'
import { Segmented } from '@/shared/ui/Segmented'
import type { DueSort } from '../schemas'
import { DUE_SORT_PARAM, dueHref } from './stock-paths'

type DueSortSwitchProps = Readonly<{ sort: DueSort }>

const OPTIONS = [
  { value: 'date', label: 'Nach Datum' },
  { value: 'location', label: 'Nach Lagerort' },
] as const

// Sortierung für den Gang durch den Keller (UX-Konzept §8.2). Sie steht in der Adresse (P14).
export function DueSortSwitch({ sort }: DueSortSwitchProps) {
  const router = useRouter()
  return (
    <div className="px-4 pt-2 breit:px-6">
      <Segmented
        legend="Sortierung"
        name={DUE_SORT_PARAM}
        options={OPTIONS}
        defaultValue={sort}
        onChange={(value) => {
          router.replace(dueHref(value === 'location' ? 'location' : 'date'), { scroll: false })
        }}
      />
    </div>
  )
}
