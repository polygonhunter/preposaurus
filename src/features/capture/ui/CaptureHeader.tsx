import { PageHeader } from '@/shared/ui/PageHeader'
import { CaptureCancel } from './CaptureCancel'
import { CaptureModeSwitch } from './CaptureModeSwitch'

type CaptureHeaderProps = Readonly<{
  subtitle?: string
  /** Umschalter Foto · Manuell, ohne ihn nur Titel und „Abbrechen“ (Entwurfsfrage, kein Haushalt) */
  mode?: 'foto' | 'manuell'
}>

// Kopf jeder Erfassen-Seite (#285): „Abbrechen“ oben links statt Tab-Leiste, Titel „Erfassen“ als h1,
// darunter der Umschalter. So hat jede Seite im Vollbild einen Weg hinaus.
export function CaptureHeader({ subtitle, mode }: CaptureHeaderProps) {
  return (
    <>
      {subtitle === undefined ? (
        <PageHeader title="Erfassen" leading={<CaptureCancel />} />
      ) : (
        <PageHeader title="Erfassen" subtitle={subtitle} leading={<CaptureCancel />} />
      )}
      {mode === undefined ? null : <CaptureModeSwitch current={mode} />}
    </>
  )
}
