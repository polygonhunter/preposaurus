'use client'

import { RetryNotice } from '@/shared/ui/RetryNotice'
import { StandalonePage } from '@/shared/ui/StandalonePage'
import './globals.css'

type GlobalErrorProps = Readonly<{ error: unknown; retry: () => void }>

// Fehler im Root-Layout selbst (#215). Ersetzt das Root-Layout, braucht deshalb eigenes <html>,
// <body> und die globalen Styles. Gleicher Inhalt wie error.tsx.
export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="de">
      <body className="bg-bg font-sans text-body text-fg antialiased">
        <title>Fehler · Preposaurus</title>
        <StandalonePage>
          <RetryNotice onRetry={retry} />
        </StandalonePage>
      </body>
    </html>
  )
}
