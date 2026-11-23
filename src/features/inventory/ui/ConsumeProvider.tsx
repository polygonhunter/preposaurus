'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { OFFLINE_WRITE_MESSAGE } from '@/shared/ui/OfflineWriteGuard'
import { UndoBar } from '@/shared/ui/UndoBar'
import { addToRestockAction, takeBackFromRestockAction } from '../actions/add-to-restock-action'
import { consumeAction } from '../actions/consume-action'
import { undoConsumeAction } from '../actions/undo-consume-action'
import type { BestBeforeDto, ConsumeRequest } from '../schemas'
import { ConsumeContext, type TakenLabel } from './consume-context'
import { formatDate, formatTakenMessage } from './stock-format'

type UndoNotice = Readonly<{
  kind: 'undo'
  unitId: string
  message: string
  // Nach „Nachkaufen“ steht das Produkt auf der Liste, das zweite Angebot entfällt
  isListed: boolean
  // Von diesem Tipp angelegt: „Rückgängig“ nimmt ihn mit zurück (DATENKATALOG §5)
  addedRestockItemId: string | null
}>

type Notice = UndoNotice | Readonly<{ kind: 'error'; message: string }>

const dateOf = (bestBefore: BestBeforeDto | null) =>
  bestBefore === null ? null : formatDate(bestBefore)

// Zweites Angebot der Rückgängig-Zeile, solange das Produkt nicht auf die Liste gesetzt ist
const restockOffer = (notice: UndoNotice, putOn: (notice: UndoNotice) => void) =>
  notice.isListed
    ? {}
    : {
        secondary: {
          label: 'Nachkaufen',
          onClick: () => {
            putOn(notice)
          },
        },
      }

type ConsumeProviderProps = Readonly<{ children: ReactNode }>

// Erfolg zeigt fünf Sekunden „Rückgängig“, keine Rückfrage vorher (UX-Konzept §7, P7), dazu das
// Angebot „Nachkaufen“ (UX D15, #74). Ein Fehler steht unten an derselben Stelle, die Seite lädt
// dabei neu, die Zeile springt also zurück.
export function ConsumeProvider({ children }: ConsumeProviderProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()
  // Ohne Verbindung sind die Knöpfe gesperrt, der Hinweis oben auf der Seite sagt warum.
  const isOnline = useIsOnline()
  const isLocked = isPending || !isOnline

  // Die Rückgängig-Zeile steht fünf Sekunden da, die Verbindung kann in der Zeit wegfallen.
  const isOfflineNow = () => {
    if (isOnline) return false
    setNotice({ kind: 'error', message: OFFLINE_WRITE_MESSAGE })
    return true
  }

  const consume = (request: ConsumeRequest, { name, dateLabel }: TakenLabel) => {
    startTransition(async () => {
      const result = await consumeAction(request)
      setNotice(
        result.ok
          ? {
              kind: 'undo',
              unitId: result.taken.unitId,
              message: formatTakenMessage(name, dateLabel ?? dateOf(result.taken.bestBefore)),
              isListed: false,
              addedRestockItemId: null,
            }
          : { kind: 'error', message: result.message },
      )
    })
  }

  const undo = ({ unitId, addedRestockItemId }: UndoNotice) => {
    if (isOfflineNow()) return
    setNotice(null)
    startTransition(async () => {
      const result = await undoConsumeAction(unitId)
      if (!result.ok) setNotice({ kind: 'error', message: result.message })
      else if (addedRestockItemId !== null) await takeBackFromRestockAction(addedRestockItemId)
    })
  }

  // Das Angebot verschwindet sofort, damit ein zweiter schneller Tipp nichts mehr auslöst
  const putOnRestockList = (current: UndoNotice) => {
    if (isOfflineNow()) return
    setNotice({ ...current, isListed: true })
    startTransition(async () => {
      const result = await addToRestockAction(current.unitId)
      setNotice(
        result.ok
          ? {
              ...current,
              message: result.message,
              isListed: true,
              addedRestockItemId: result.addedItemId,
            }
          : { kind: 'error', message: result.message },
      )
    })
  }

  const dismiss = () => {
    setNotice(null)
  }

  return (
    <ConsumeContext value={{ consume, isLocked }}>
      {children}
      {notice?.kind === 'undo' ? (
        <UndoBar
          key={notice.unitId}
          message={notice.message}
          onUndo={() => {
            undo(notice)
          }}
          onDismiss={dismiss}
          {...restockOffer(notice, putOnRestockList)}
        />
      ) : null}
      {notice?.kind === 'error' ? <NoticeBar message={notice.message} onDismiss={dismiss} /> : null}
    </ConsumeContext>
  )
}
