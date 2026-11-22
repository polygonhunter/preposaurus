import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Preposaurus',
  description: 'Notvorrat planen und verwalten',
}

// viewport-fit=cover, damit env(safe-area-inset-*) auf dem iPhone greift. Farben wie --color-bg.
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body className="bg-bg font-sans text-body text-fg antialiased">{children}</body>
    </html>
  )
}
