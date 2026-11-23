import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'

type RetryNoticeProps = Readonly<{ onRetry: () => void }>

// Inhalt der Fehlerseiten (#215): ein ruhiger Satz und genau eine Handlung. Keine technischen
// Details, die stehen im Server-Log. Nur in Client-Komponenten (error.tsx, global-error.tsx).
export function RetryNotice({ onRetry }: RetryNoticeProps) {
  return (
    <>
      <PageHeader title="Etwas ist schiefgegangen" />
      <EmptyState text="Das hat gerade nicht geklappt. Bitte noch einmal versuchen.">
        <Button variant="tinted" onClick={onRetry}>
          Neu laden
        </Button>
      </EmptyState>
    </>
  )
}
