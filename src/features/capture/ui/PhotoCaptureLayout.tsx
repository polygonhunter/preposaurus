import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/class-names'
import { EVEN_SPLIT_COLUMNS, FOLD_SPLIT_MARKER } from '@/shared/ui/split-columns'

type PhotoCaptureLayoutProps = Readonly<{
  /** Titel und Umschalter Foto · Manuell */
  header: ReactNode
  /** Offene Kamera, sonst null */
  camera: ReactNode
  /** Prüfen bzw. Bestätigung, kompakt bei offener Kamera nichts */
  children: ReactNode
}>

// Ab „breit“ mit offener Kamera: Kamera links, Titel und wachsender Vorschlag rechts (UX §8.5 „Am
// PC“). Ohne Falz zwei gleiche Hälften, mit Falz die Kamera links bis zur Falz (split-columns.ts).
// Ab „weit“ bekommt das Formular 40 %, mindestens 420 px. Kompakt liegt die Kamera im Vollbild
// darüber. Die rechte Spalte bleibt beim Öffnen und Schließen der Kamera dasselbe Element, so
// verliert das Formular nichts.
const SPLIT = cx(EVEN_SPLIT_COLUMNS, 'weit:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]')

export function PhotoCaptureLayout({ header, camera, children }: PhotoCaptureLayoutProps) {
  const isSplit = camera !== null
  return (
    <div {...(isSplit ? FOLD_SPLIT_MARKER : {})} className={cx(isSplit && SPLIT)}>
      {camera}
      <div className={cx(isSplit && 'min-w-0 breit:col-start-2 breit:row-start-1')}>
        {header}
        {children}
      </div>
    </div>
  )
}
