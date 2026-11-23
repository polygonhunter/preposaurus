import type { ReactNode } from 'react'

type GroupFooterProps = Readonly<{ children: ReactNode }>

// Erklärung unter einer Gruppe, eingerückt wie der Gruppenkopf (z. B. „Das ändert ein Admin.“).
export function GroupFooter({ children }: GroupFooterProps) {
  return <p className="px-8 pt-[7px] text-footnote text-fg2 breit:px-10">{children}</p>
}
