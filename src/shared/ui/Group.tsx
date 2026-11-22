import type { ReactNode } from 'react'

type GroupProps = Readonly<{
  children: ReactNode
  // id des GroupHeader, damit Screenreader die Liste mit ihrem Namen ansagen
  labelledBy?: string
}>

// Gruppierte Liste auf surface. Kinder sind Row-Elemente.
export function Group({ children, labelledBy }: GroupProps) {
  return (
    <ul
      aria-labelledby={labelledBy}
      className="mx-4 overflow-hidden rounded-group bg-surface breit:mx-6 breit:border breit:border-line"
    >
      {children}
    </ul>
  )
}
