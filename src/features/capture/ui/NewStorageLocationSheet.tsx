'use client'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Sheet } from '@/shared/ui/Sheet'
import { useNewStorageLocation, type AddedLocation } from './use-new-storage-location'

type NewStorageLocationSheetProps = Readonly<{
  onClose: () => void
  /** Neu angelegt oder unter diesem Namen schon vorhanden: Das Formular wählt den Ort */
  onAdded: (added: AddedLocation) => void
}>

// Neuer Lagerort direkt aus der Erfassung (#301), nur mit Namen, wie „Neue Lebensmittelart“. Kein
// eigenes <form>, weil das Blatt im Erfassen-Formular liegt: Enter im Namen legt an, statt das
// Erfassen abzuschicken.
export function NewStorageLocationSheet({ onClose, onAdded }: NewStorageLocationSheetProps) {
  const form = useNewStorageLocation(onAdded)
  const { problem } = form
  return (
    <Sheet
      isOpen
      onClose={onClose}
      title="Neuer Lagerort"
      actions={
        <>
          <Button onClick={form.create} pendingLabel={form.isPending ? 'Legt an …' : undefined}>
            Anlegen
          </Button>
          <Button variant="plain" onClick={onClose}>
            Abbrechen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Name des Lagerorts"
          name="neuer-lagerort"
          maxLength={40}
          autoComplete="off"
          value={form.name}
          hint="Zum Beispiel „Keller“ oder „Vorratsschrank“"
          onChange={(event) => {
            form.change(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            form.create()
          }}
          error={problem?.nameError ?? undefined}
        />
        {problem?.message ? (
          <p role="alert" className="px-4 text-footnote text-red">
            {problem.message}
          </p>
        ) : null}
      </div>
    </Sheet>
  )
}
