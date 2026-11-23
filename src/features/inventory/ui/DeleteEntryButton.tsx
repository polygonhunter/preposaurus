'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { Button } from '@/shared/ui/Button'
import { OFFLINE_WRITE_MESSAGE } from '@/shared/ui/OfflineWriteGuard'
import { Sheet } from '@/shared/ui/Sheet'
import { deleteEntryAction } from '../actions/delete-entry-action'
import type { DeleteEntryRequest } from '../schemas'

type DeleteEntryButtonProps = Readonly<{
  target: DeleteEntryRequest
  // Text des Knopfs, z. B. „Produkt löschen …“
  label: string
  // Frage im Blatt, z. B. „Spaghetti 500 g mit allen Packungen und dem Verlauf löschen?“
  question: string
  // Wohin es geht, wenn das Produkt weg ist. null: Die Seite bleibt (andere Produkte sind noch da)
  leaveHref: string | null
  onDone?: () => void
}>

const IRREVERSIBLE = 'Das lässt sich nicht rückgängig machen.'

// Fehlerfassung endgültig löschen (#50, UX §8.4): nur für den Admin sichtbar. Hier und nur hier
// fragt die App vorher nach, weil es kein Rückgängig gibt (UX P7).
export function DeleteEntryButton(props: DeleteEntryButtonProps) {
  const { target, label, question, leaveHref, onDone } = props
  const router = useRouter()
  const isOnline = useIsOnline()
  const [isOpen, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const close = () => {
    setOpen(false)
    setMessage(null)
  }

  const confirm = () => {
    // Nur per aria-disabled gesperrt: Der Tipp erklärt im Blatt, warum es gerade nicht geht (#216)
    if (!isOnline) {
      setMessage(OFFLINE_WRITE_MESSAGE)
      return
    }
    if (isPending) return
    startTransition(async () => {
      const result = await deleteEntryAction(target)
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      close()
      onDone?.()
      if (!result.isProductRemoved) return
      if (leaveHref === null) router.refresh()
      else router.push(leaveHref)
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => {
          setOpen(true)
        }}
      >
        {label}
      </Button>
      <Sheet
        isOpen={isOpen}
        onClose={close}
        title="Endgültig löschen?"
        actions={
          <>
            <Button
              variant="destructive"
              aria-disabled={!isOnline}
              pendingLabel={isPending ? 'Löscht …' : undefined}
              onClick={confirm}
            >
              Endgültig löschen
            </Button>
            <Button variant="plain" onClick={close}>
              Abbrechen
            </Button>
          </>
        }
      >
        <p>{question}</p>
        <p className="pt-2 text-callout text-fg2">{IRREVERSIBLE}</p>
        {message === null ? null : (
          <p role="alert" className="pt-2 text-callout text-red">
            {message}
          </p>
        )}
      </Sheet>
    </>
  )
}
