import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Preposaurus',
  description: 'Notvorrat planen und verwalten',
}

type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  )
}
