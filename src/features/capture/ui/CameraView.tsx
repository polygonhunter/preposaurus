'use client'
import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { CameraDateChips } from './CameraDateChips'
import { CameraStepAction } from './CameraStepAction'
import { CameraFallback } from './CameraFallback'
import type { CaptureStep, DateShot, PhotoDateEntry } from './photo-capture-state'
import { Shutter } from './Shutter'
import { StepBar } from './StepBar'
import { useCamera } from './use-camera'

type CameraViewProps = Readonly<{
  step: CaptureStep
  onPhoto: (file: Blob) => void
  /** Kamera zu, weiter im Schritt Prüfen (auch „Von Hand“) */
  onClose: () => void
  onSkipTable: () => void
  dates: Readonly<{ units: readonly PhotoDateEntry[]; shots: readonly DateShot[] }>
}>

const HINTS: Record<CaptureStep, string> = {
  verpackung: 'Vorderseite der Verpackung',
  naehrwerte: 'Nährwerttabelle',
  mhd: 'Datum einer Packung',
}

const packageNumber = ({ units, shots }: CameraViewProps['dates']) =>
  units.reduce((sum, entry) => sum + entry.count, 0) + shots.length + 1

// Vollbild-Kamera (#61, DESIGN_SYSTEM §7): immer dunkel, Schrittbalken oben, Auslöser 72 px. Der
// Auslöser ist sofort wieder bereit, Upload und Erkennung laufen im Hintergrund.
export function CameraView(props: CameraViewProps) {
  const { step, onPhoto, onClose, dates } = props
  const { videoRef, status, capture } = useCamera()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isLive = status === 'live'
  const hint =
    step === 'mhd' ? `${HINTS.mhd} · Packung ${String(packageNumber(dates))}` : HINTS[step]

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  async function shoot() {
    const blob = await capture()
    if (blob !== null) onPhoto(blob)
  }

  return (
    <section
      aria-labelledby="kamera-titel"
      className="fixed inset-0 z-50 flex flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))] text-fg scheme-dark"
    >
      <div className="flex items-start gap-3 px-4 pt-3">
        <StepBar step={step} />
        <button
          type="button"
          aria-label="Kamera schließen"
          onClick={onClose}
          className="touch-target -mt-1 flex size-9 items-center justify-center rounded-full bg-fill"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="relative mx-4 mt-3 flex-1 overflow-hidden rounded-group bg-surface">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-hidden="true"
          className={isLive ? 'size-full object-cover' : 'hidden'}
        />
        {status === 'live' ? null : <CameraFallback status={status} onManual={onClose} />}
      </div>
      <h2
        id="kamera-titel"
        ref={headingRef}
        tabIndex={-1}
        className="px-4 pt-3 text-center text-headline outline-none"
      >
        {hint}
      </h2>
      <div className="pt-2">{step === 'mhd' ? <CameraDateChips {...dates} /> : null}</div>
      <div className="grid grid-cols-3 items-center px-4 pt-3">
        <span />
        <div className="flex justify-center">
          <Shutter
            isLive={isLive}
            onCapture={() => void shoot()}
            onFile={onPhoto}
            label="Foto aufnehmen"
          />
        </div>
        <div className="flex justify-end">
          <CameraStepAction step={step} onClose={onClose} onSkipTable={props.onSkipTable} />
        </div>
      </div>
    </section>
  )
}
