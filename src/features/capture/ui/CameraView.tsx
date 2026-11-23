'use client'
import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { CameraDateChips } from './CameraDateChips'
import { CameraStepAction } from './CameraStepAction'
import { CameraFallback } from './CameraFallback'
import { CameraNotice } from './CameraNotice'
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
  /** Erkennung aus (#210): gleich zu Beginn sagen, dass nichts gelesen wird */
  notice: string | null
  dates: Readonly<{ units: readonly PhotoDateEntry[]; shots: readonly DateShot[] }>
}>

const HINTS: Record<CaptureStep, string> = {
  verpackung: 'Vorderseite der Verpackung',
  naehrwerte: 'Nährwerttabelle',
  mhd: 'Datum einer Packung',
}

const packageNumber = ({ units, shots }: CameraViewProps['dates']) =>
  units.reduce((sum, entry) => sum + entry.count, 0) + shots.length + 1

// Kompakt und mittel im Vollbild über allem. Ab „breit“ (UX §8.5 „Am PC“) steht die Kamera als
// Spalte links und klebt in voller Höhe, das Formular wächst rechts daneben (PhotoCaptureFlow).
const FRAME =
  'fixed inset-0 z-50 flex flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))] text-fg scheme-dark breit:sticky breit:top-0 breit:z-auto breit:h-dvh'
// Stufe mittel (Duo hochkant, M12-05): Sucher in der oberen Hälfte, Hinweis, Chips und Auslöser in
// der unteren, 24 px frei um die Falz.
const VIEWFINDER_HALF =
  'flex min-h-0 flex-1 flex-col nur-mittel:h-[calc(50dvh-12px-env(safe-area-inset-top))] nur-mittel:flex-none'
const CONTROLS_HALF = 'nur-mittel:mt-6 nur-mittel:flex nur-mittel:flex-1 nur-mittel:flex-col'

// Kamera (#61, DESIGN_SYSTEM §7): immer dunkel, Schrittbalken oben, Auslöser 72 px. Der Auslöser
// ist sofort wieder bereit, Upload und Erkennung laufen im Hintergrund.
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
    <section aria-labelledby="kamera-titel" className={FRAME}>
      <div className={VIEWFINDER_HALF}>
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
        {props.notice === null ? null : <CameraNotice text={props.notice} onManual={onClose} />}
        <div className="relative mx-4 mt-3 min-h-0 flex-1 overflow-hidden rounded-group bg-surface">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-hidden="true"
            className={isLive ? 'size-full object-cover' : 'hidden'}
          />
          {status === 'live' ? null : <CameraFallback status={status} onManual={onClose} />}
        </div>
      </div>
      <div className={CONTROLS_HALF}>
        <h2
          id="kamera-titel"
          ref={headingRef}
          tabIndex={-1}
          className="px-4 pt-3 text-center text-headline outline-none"
        >
          {hint}
        </h2>
        <div className="pt-2">{step === 'mhd' ? <CameraDateChips {...dates} /> : null}</div>
        <div className="grid grid-cols-3 items-center px-4 pt-3 nur-mittel:mt-auto">
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
      </div>
    </section>
  )
}
