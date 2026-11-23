import type { MetadataRoute } from 'next'

// Web-App-Manifest (M10-01, #81). Das Manifest kennt nur eine Theme-Farbe, darum die helle wie
// --color-bg. Hell und dunkel für die Statusleiste setzt viewport.themeColor im Root-Layout.
// Die Icons erzeugt scripts/build-icons.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Preposaurus',
    short_name: 'Preposaurus',
    description: 'Notvorrat planen und verwalten',
    lang: 'de',
    dir: 'ltr',
    start_url: '/uebersicht',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    categories: ['lifestyle', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
