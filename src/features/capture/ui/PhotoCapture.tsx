'use client'
import { useState, type ReactNode } from 'react'
import type { CaptureOptions } from '../domain/capture-options'
import { initialPhotoCapture, type PhotoCaptureState } from './photo-capture-state'
import { PhotoCaptureFlow } from './PhotoCaptureFlow'
import { useAddedChoices } from './use-added-choices'
import { useFreshRestart } from './use-fresh-restart'

type PhotoCaptureProps = Readonly<{
  options: CaptureOptions
  /** Fortgesetzter Entwurf oder ein frischer Stand */
  initial: PhotoCaptureState
  /** Satz, warum die Erkennung aus ist, sonst null (#210) */
  recognitionOff: string | null
  /** Titel und Umschalter, ab „breit“ rechts neben der Kamera */
  header: ReactNode
}>

// Foto-Erfassung (#61 bis #66): Kamera, Prüfen, Speichern. „Noch eins“ und „Verwerfen“ beginnen
// mit einem frischen Stand, die Vorbelegung kommt dann neu vom Server.
export function PhotoCapture({ initial, recognitionOff, header, ...props }: PhotoCaptureProps) {
  // Neue Arten (#142) und Orte (#301) bleiben über „Noch eins“ hinweg in der Auswahl
  const { options, addFoodType, addStorageLocation } = useAddedChoices(props.options)
  const [run, setRun] = useState({ generation: 0, initial })
  const fresh = useFreshRestart(() => {
    setRun((previous) => ({
      generation: previous.generation + 1,
      initial: initialPhotoCapture(options.lastStorageLocationId),
    }))
  })
  return (
    <PhotoCaptureFlow
      key={run.generation}
      options={options}
      onFoodTypeAdded={addFoodType}
      onStorageLocationAdded={addStorageLocation}
      initial={run.initial}
      recognitionOff={recognitionOff}
      header={header}
      isRestarting={fresh.isReloading}
      onRestart={fresh.restart}
    />
  )
}
