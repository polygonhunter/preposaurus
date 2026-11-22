'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Sheet } from '@/shared/ui/Sheet'
import { UndoBar } from '@/shared/ui/UndoBar'

export function OverlayDemo() {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [isUndoVisible, setUndoVisible] = useState(false)
  const closeSheet = () => {
    setSheetOpen(false)
  }
  const hideUndo = () => {
    setUndoVisible(false)
  }
  const openSheet = () => {
    setSheetOpen(true)
  }
  const showUndo = () => {
    setUndoVisible(true)
  }
  return (
    <>
      <GroupHeader>Blatt und Rückgängig</GroupHeader>
      <div className="mx-4 flex flex-wrap gap-3 rounded-group bg-surface p-4">
        <Button variant="tinted" onClick={openSheet}>
          Blatt öffnen
        </Button>
        <Button variant="tinted" onClick={showUndo}>
          1 entnehmen
        </Button>
      </div>
      <GroupHeader>Leer</GroupHeader>
      <EmptyState
        text="Noch nichts auf der Einkaufsliste."
        action={{ href: '/neu', label: 'Eintrag ergänzen' }}
      />
      <Sheet
        isOpen={isSheetOpen}
        onClose={closeSheet}
        title="Haferflocken"
        actions={
          <>
            <Button onClick={closeSheet}>Verbraucht</Button>
            <Button variant="plain" onClick={closeSheet}>
              Abbrechen
            </Button>
          </>
        }
      >
        MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.
      </Sheet>
      {isUndoVisible ? (
        <UndoBar
          message="1 Haferflocken entnommen"
          onUndo={hideUndo}
          onDismiss={hideUndo}
          secondary={{ label: 'Auf Einkaufsliste', onClick: hideUndo }}
        />
      ) : null}
    </>
  )
}
