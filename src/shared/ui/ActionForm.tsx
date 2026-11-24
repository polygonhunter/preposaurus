'use client'
import type { ComponentProps } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { LiveMessage } from './LiveMessage'

type ActionFormProps = Omit<ComponentProps<'form'>, 'ref' | 'action' | 'noValidate'> &
  Readonly<{
    action: (formData: FormData) => void
    /** Antwort der Action. Mit jeder neuen springt der Fokus ins erste fehlerhafte Feld. */
    result: unknown
    /** Erste Fehlermeldung. Sichtbar steht sie schon am Feld, hier wird sie angesagt. */
    announcement: string | null | undefined
  }>

// Formular, das selbst prüft (#286): Pflichtfelder meldet das Schema der Action ruhig am Feld,
// nicht die Sprechblase des Browsers in dessen Sprache. `required` bleibt am Feld, damit
// Screenreader „erforderlich“ ansagen. Danach Fokus ins erste fehlerhafte Feld und eine Ansage.
export function ActionForm({
  action,
  result,
  announcement,
  children,
  ...formProps
}: ActionFormProps) {
  const formRef = useFocusFirstInvalid(result)
  return (
    <form {...formProps} ref={formRef} action={action} noValidate>
      {children}
      <LiveMessage message={announcement} />
    </form>
  )
}
