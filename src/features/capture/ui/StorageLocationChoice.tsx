'use client'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import type { NamedChoice } from '../domain/capture-options'
import { ChoiceChips } from './ChoiceChips'
import { NewStorageLocationSheet } from './NewStorageLocationSheet'
import type { AddedLocation } from './use-new-storage-location'

type StorageLocationChoiceProps = Readonly<{
  locations: readonly NamedChoice[]
  selectedId: string | null
  onChange: (storageLocationId: string | null) => void
  /** Neu angelegten Ort in die Auswahl aufnehmen (#301) */
  onAdded: (location: NamedChoice) => void
}>

const existingNote = (name: string) => `„${name}“ gab es schon, der Ort ist jetzt gewählt.`

// Lagerort beim Erfassen (UX §1, freiwillig): Chips und darunter „+ Neuer Lagerort“ (#301), für
// Admin und Mitglied. Der neue Ort ist gleich gewählt. Gab es ihn unter dem Namen schon, wird der
// vorhandene gewählt und ein Satz sagt das.
export function StorageLocationChoice(props: StorageLocationChoiceProps) {
  const { locations, selectedId, onChange, onAdded } = props
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  function choose(added: AddedLocation) {
    // Erst das modale Blatt schließen, sonst bleibt der Fokus darin gefangen.
    flushSync(() => {
      setSheetOpen(false)
    })
    onAdded(added.location)
    onChange(added.location.id)
    setNote(added.isExisting ? existingNote(added.location.name) : null)
  }

  return (
    <ChoiceChips
      label="Lagerort"
      choices={locations}
      selectedId={selectedId}
      onChange={(storageLocationId) => {
        setNote(null)
        onChange(storageLocationId)
      }}
      emptyText="Noch keine Lagerorte angelegt. Ohne Lagerort geht es auch."
    >
      <div className="px-4 breit:px-6">
        <Button
          variant="plain"
          className="text-left"
          onClick={() => {
            setSheetOpen(true)
          }}
        >
          + Neuer Lagerort
        </Button>
        <p role="status" className="px-4 text-footnote text-fg2 empty:hidden">
          {note}
        </p>
      </div>
      {isSheetOpen ? (
        <NewStorageLocationSheet
          onClose={() => {
            setSheetOpen(false)
          }}
          onAdded={choose}
        />
      ) : null}
    </ChoiceChips>
  )
}
