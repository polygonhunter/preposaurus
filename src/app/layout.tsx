import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { isServiceWorkerEnabled } from '@/shared/config/env'
import { ServiceWorkerRegistrar } from '@/shared/ui/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Preposaurus',
  description: 'Notvorrat planen und verwalten',
  // Home-Bildschirm auf dem iPhone (M10-01): eigener Name unter dem Icon, Statusleiste wie die App.
  appleWebApp: { capable: true, title: 'Preposaurus', statusBarStyle: 'default' },
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

// Jede Seite rendert je Anfrage, weil Next die Nonce der CSP nur dann an seine Skripte hängen kann
// (#198, Next-Doku „Content Security Policy“). Eine vorab gebaute Seite liefe ohne Nonce nicht.
export default async function RootLayout({ children }: RootLayoutProps) {
  await connection()
  return (
    <html lang="de">
      <body className="bg-bg font-sans text-body text-fg antialiased">
        {children}
        <ServiceWorkerRegistrar isEnabled={isServiceWorkerEnabled()} />
      </body>
    </html>
  )
}
