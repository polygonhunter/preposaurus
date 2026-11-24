import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { Button } from './Button'
import { SaveStatus, type SaveState } from './SaveStatus'

export type FormSubmitProps = Readonly<{
  label: ReactNode
  isPending: boolean
  /** Was beim Absenden passiert, in Worten (DESIGN_SYSTEM §5 `Button`) */
  pendingLabel?: string
  /** Rückmeldung nach dem Speichern, unter dem Knopf */
  status?: SaveState
  /** Das Formular hat keinen eigenen Seitenrand (Gruppen mit Schaltern): Der Knopf rückt ein. */
  isInset?: boolean
  /** Unter dem Knopf: eine Nebenaktion („Abbrechen“) oder ein kurzer Hinweis */
  after?: ReactNode
}>

// Absende-Knopf jedes Formulars (DESIGN_SYSTEM §7, #287): `primary` unten, so breit wie das
// Formular, höchstens 768 px wie die Lesespalte (#288). ActionForm setzt ihn selbst, Rückfragen
// im Blatt ohne Felder („Löschen?“) nutzen ihn direkt.
export function FormSubmit({
  label,
  isPending,
  pendingLabel = 'Speichert …',
  status,
  isInset = false,
  after,
}: FormSubmitProps) {
  return (
    <div
      data-form-submit
      className={cx('flex max-w-3xl flex-col gap-2', isInset ? 'mx-4 pt-4 breit:mx-6' : 'pt-2')}
    >
      <Button type="submit" pendingLabel={isPending ? pendingLabel : undefined}>
        {label}
      </Button>
      {status ? <SaveStatus state={status} /> : null}
      {after}
    </div>
  )
}
