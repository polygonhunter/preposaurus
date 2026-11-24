import type { ReactNode } from 'react'
import { CaptureLeaveProvider } from '@/features/capture/ui/CaptureLeaveProvider'
import { AppFrame } from '../_frame/AppFrame'

type CaptureLayoutProps = Readonly<{ children: ReactNode }>

// Erfassen im Vollbild (UX_KONZEPT §6, #285): kompakt und mittel ohne Tab-Leiste, mit „Abbrechen“
// oben links. Ab „breit“ bleibt die Seitenleiste, die Falz-Spalten rechnen mit ihr. Der Provider
// sagt „Abbrechen“, ob ein Formular ungespeicherte Eingaben oder einen Entwurf hat.
export default function CaptureLayout({ children }: CaptureLayoutProps) {
  return (
    <AppFrame isFocused>
      <CaptureLeaveProvider>{children}</CaptureLeaveProvider>
    </AppFrame>
  )
}
