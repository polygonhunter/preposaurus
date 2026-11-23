'use client'

import { RetryNotice } from '@/shared/ui/RetryNotice'
import { StandalonePage } from '@/shared/ui/StandalonePage'

type ErrorPageProps = Readonly<{ error: unknown; retry: () => void }>

// Unerwarteter Fehler unterhalb des Root-Layouts (#215), z. B. Datenbank nicht erreichbar. Statt
// der englischen Standardseite ein ruhiger Satz und „Neu laden“: retry() lädt den Abschnitt neu
// vom Server. Die Ursache steht im Server-Log (error.digest verweist darauf).
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <StandalonePage>
      <title>Fehler · Preposaurus</title>
      <RetryNotice onRetry={retry} />
    </StandalonePage>
  )
}
