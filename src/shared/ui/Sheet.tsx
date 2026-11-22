'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

type SheetProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  // Knöpfe unten, z. B. ein primary-Button
  actions?: ReactNode
}>

// Blatt von unten als modaler <dialog>: Fokusfalle, Escape und Hintergrund-Sperre liefert der Browser.
// Ein Tippen auf den abgedunkelten Hintergrund schließt es ebenfalls. Ab „breit“ ein zentrierter Dialog.
export function Sheet({ isOpen, onClose, title, children, actions }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // Der Inhalt füllt den Dialog ganz aus, ein Klick direkt auf <dialog> trifft also nur den Hintergrund.
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close()
    }
    dialog.addEventListener('click', closeOnBackdrop)
    return () => {
      dialog.removeEventListener('click', closeOnBackdrop)
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-none rounded-t-sheet bg-surface text-fg shadow-thumb backdrop:bg-scrim breit:my-auto breit:max-w-md breit:rounded-sheet"
    >
      <div className="flex flex-col gap-4 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto h-[5px] w-9 rounded-full bg-line breit:hidden" />
        <h2 id={titleId} className="text-headline">
          {title}
        </h2>
        <div className="text-body">{children}</div>
        {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
      </div>
    </dialog>
  )
}
