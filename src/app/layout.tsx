import type { Metadata, Viewport } from 'next'
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body className="bg-bg font-sans text-body text-fg antialiased">
        {children}
        <ServiceWorkerRegistrar isEnabled={isServiceWorkerEnabled()} />
      </body>
    </html>
  )
}
