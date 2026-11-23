import { Button } from '@/shared/ui/Button'
import type { CaptureStep } from './photo-capture-state'

type CameraStepActionProps = Readonly<{
  step: CaptureStep
  onClose: () => void
  onSkipTable: () => void
}>

// Rechts neben dem Auslöser: „Von Hand“ (Verpackung), „Keine Tabelle“ (Nährwerte, #115) oder
// „Fertig“ (MHD-Serie). So geht jeder Schritt auch ohne Foto weiter.
export function CameraStepAction({ step, onClose, onSkipTable }: CameraStepActionProps) {
  if (step === 'naehrwerte') {
    return (
      <Button variant="plain" onClick={onSkipTable} className="text-fg">
        Keine Tabelle
      </Button>
    )
  }
  return (
    <Button variant="plain" onClick={onClose} className="text-fg">
      {step === 'mhd' ? 'Fertig' : 'Von Hand'}
    </Button>
  )
}
