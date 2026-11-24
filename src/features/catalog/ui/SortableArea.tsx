'use client'

import type { ReactNode } from 'react'
import { useFocusRescue } from '@/shared/hooks/use-focus-rescue'

// Bereich einer sortierbaren Liste (Lagerorte, eigene Arten, #243): Rückt eine Zeile, setzt React
// sie im DOM um, und der Fokus fiele auf body. useFocusRescue führt ihn zurück auf den Knopf.
export function SortableArea({ children }: Readonly<{ children: ReactNode }>) {
  const focusRef = useFocusRescue<HTMLDivElement>(false)
  return <div ref={focusRef}>{children}</div>
}
