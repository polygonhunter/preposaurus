import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'

type RowFooterProps = Readonly<{ hasIcon: boolean; children: ReactNode }>

// Knopfreihe oder Auswahl unter einer Zeile, eingerückt wie der Text.
export function RowFooter({ hasIcon, children }: RowFooterProps) {
  return (
    <div className={cx('flex flex-wrap gap-2 pr-4 pb-3', hasIcon ? 'pl-[52px]' : 'pl-4')}>
      {children}
    </div>
  )
}
