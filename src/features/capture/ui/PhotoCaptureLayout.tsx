import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { FOLD_SPLIT_COLUMNS } from '@/shared/ui/split-columns'

type PhotoCaptureLayoutProps = Readonly<{
  /** Titel und Umschalter Foto · Manuell */
  header: ReactNode
  /** Offene Kamera, sonst null */
  camera: ReactNode
  /** Prüfen bzw. Bestätigung, kompakt bei offener Kamera nichts */
  children: ReactNode
}>

// Ab „breit“ mit offener Kamera: Kamera links, Titel und wachsender Vorschlag rechts (UX §8.5 „Am
// PC“), die Grenze in der Fenstermitte (Falz beim Duo quer). Ab „weit“ bekommt das Formular 40 %,
// mindestens 420 px. Kompakt liegt die Kamera im Vollbild darüber. Die rechte Spalte bleibt beim
// Öffnen und Schließen der Kamera dasselbe Element, so verliert das Formular nichts.
const SPLIT = cx(FOLD_SPLIT_COLUMNS, 'weit:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]')

export function PhotoCaptureLayout({ header, camera, children }: PhotoCaptureLayoutProps) {
  const isSplit = camera !== null
  return (
    <div className={cx(isSplit && SPLIT)}>
      {camera}
      <div className={cx(isSplit && 'min-w-0 breit:col-start-2 breit:row-start-1')}>
        {header}
        {children}
      </div>
    </div>
  )
}
