'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CaptureOptions } from '../domain/capture-options'
import { initialPhotoCapture, type PhotoCaptureState } from './photo-capture-state'
import { PhotoCaptureFlow } from './PhotoCaptureFlow'

type PhotoCaptureProps = Readonly<{
  options: CaptureOptions
  /** Fortgesetzter Entwurf oder ein frischer Stand */
  initial: PhotoCaptureState
}>

// Foto-Erfassung (#61 bis #66): Kamera, Prüfen, Speichern. „Noch eins“ und „Verwerfen“ beginnen
// mit einem frischen Stand, die Vorbelegung kommt dann neu vom Server.
export function PhotoCapture({ options, initial }: PhotoCaptureProps) {
  const router = useRouter()
  const [run, setRun] = useState({ generation: 0, initial })
  return (
    <PhotoCaptureFlow
      key={run.generation}
      options={options}
      initial={run.initial}
      onRestart={() => {
        setRun((previous) => ({
          generation: previous.generation + 1,
          initial: initialPhotoCapture(options.lastStorageLocationId),
        }))
        router.refresh()
      }}
    />
  )
}
