'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { ActionErrorBar } from '@/shared/ui/ActionErrorBar'
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

type ConsumeProviderProps = Readonly<{ children: ReactNode }>

// Erfolg zeigt fünf Sekunden „Rückgängig“, keine Rückfrage vorher (UX-Konzept §7, P7), dazu das
// Angebot „Nachkaufen“ (UX D15, #74). Ein Fehler steht unten an derselben Stelle, die Seite lädt
// dabei neu, die Zeile springt also zurück.
export function ConsumeProvider({ children }: ConsumeProviderProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()

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
    setNotice(null)
    startTransition(async () => {
      const result = await undoConsumeAction(unitId)
      if (!result.ok) setNotice({ kind: 'error', message: result.message })
      else if (addedRestockItemId !== null) await takeBackFromRestockAction(addedRestockItemId)
    })
  }

  // Das Angebot verschwindet sofort, damit ein zweiter schneller Tipp nichts mehr auslöst
  const putOnRestockList = (current: UndoNotice) => {
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
    <ConsumeContext value={{ consume, isPending }}>
      {children}
      {notice?.kind === 'undo' ? (
        <UndoBar
          key={notice.unitId}
          message={notice.message}
          onUndo={() => {
            undo(notice)
          }}
          onDismiss={dismiss}
          {...(notice.isListed
            ? {}
            : {
                secondary: {
                  label: 'Nachkaufen',
                  onClick: () => {
                    putOnRestockList(notice)
                  },
                },
              })}
        />
      ) : null}
      {notice?.kind === 'error' ? (
        <ActionErrorBar message={notice.message} onDismiss={dismiss} />
      ) : null}
    </ConsumeContext>
  )
}
