'use client'
// Handlungen der Seite Nachkaufen mit der einen Meldung unten: Rückgängig-Zeile nach Abhaken,
// Entfernen, „Auf die Liste“ und Ausblenden (UX-Konzept §7, §8.6, #201, #202), sonst ein Fehler am
// selben Ort.
// Ohne Verbindung ist alles gesperrt; „Rückgängig“ steht fünf Sekunden da, die Verbindung kann in
// der Zeit wegfallen, deshalb prüft jede Handlung sie noch einmal (M10).
import { useState, useTransition } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { OFFLINE_WRITE_MESSAGE } from '@/shared/ui/OfflineWriteGuard'
import { addSuggestionAction } from '../actions/add-suggestion-action'
import {
  removeRestockItemAction,
  restoreRestockItemAction,
} from '../actions/remove-restock-item-action'
import type { RestockActionFailure, RestockActionResult } from '../actions/restock-messages'
import { setGapStatusAction } from '../actions/set-gap-status-action'
import { setRestockItemDoneAction } from '../actions/set-restock-item-done-action'
import type { GapStatusChange, RemovedRestockItem } from '../schemas'
import type { GapEntry, ListedEntry, RestockEntry, SuggestionEntry } from './restock-context'

export type RestockNotice =
  | Readonly<{ kind: 'checked'; entry: RestockEntry }>
  | Readonly<{ kind: 'removed'; item: RemovedRestockItem }>
  | Readonly<{ kind: 'listed'; entry: ListedEntry }>
  | Readonly<{ kind: 'hidden'; entry: ListedEntry }>
  | Readonly<{ kind: 'error'; message: string }>

type Success<T extends object> = Readonly<{ ok: true } & T>

// TypeScript verengt die Vereinigung mit generischem T nicht über `ok`, deshalb ein Typwächter.
/**
 * Meldung nach dem Speichern einer Lücke. Eine abgehakte Lücke meldet sich wie ein abgehakter
 * Eintrag („Rückgängig“ öffnet sie wieder, „Jetzt erfassen“ ohne Vorbelegung).
 */
function gapNotice(gap: GapEntry, status: GapStatusChange['status'], id: string): RestockNotice {
  const entry = { id, label: gap.name }
  return status === 'erledigt'
    ? { kind: 'checked', entry: { ...entry, captureTarget: null } }
    : { kind: 'hidden', entry }
}

const isFailure = <T extends object>(
  result: RestockActionResult<T>,
): result is RestockActionFailure => !result.ok

/** Führt eine Action aus und setzt danach die passende Meldung (oder den Fehler). */
type Run = <T extends object>(
  action: () => Promise<RestockActionResult<T>>,
  noticeAfter: (success: Success<T>) => RestockNotice | null,
) => void

/** Lücke abhaken oder ausblenden (#201) */
const gapStatusAction = (run: Run) => (gap: GapEntry, status: GapStatusChange['status']) => {
  run(
    () => setGapStatusAction({ groupKey: gap.groupKey, status }),
    ({ entryId }) => gapNotice(gap, status, entryId),
  )
}

function restockActions(run: Run) {
  return {
    setDone: (entry: RestockEntry, isDone: boolean) => {
      run(
        () => setRestockItemDoneAction({ id: entry.id, isDone }),
        () => (isDone ? { kind: 'checked', entry } : null),
      )
    },
    remove: (entry: RestockEntry) => {
      run(
        () => removeRestockItemAction(entry.id),
        ({ removed }) => ({ kind: 'removed', item: removed }),
      )
    },
    restore: (item: RemovedRestockItem) => {
      run(
        () => restoreRestockItemAction(item),
        () => null,
      )
    },
    addSuggestion: ({ productId, label }: SuggestionEntry) => {
      run(
        () => addSuggestionAction(productId),
        ({ addedItemId }) =>
          addedItemId === null ? null : { kind: 'listed', entry: { id: addedItemId, label } },
      )
    },
    setGapStatus: gapStatusAction(run),
    /**
     * „Rückgängig“ nach „Auf die Liste“ oder Ausblenden und „Wieder zeigen“: Der neue Eintrag geht
     * still wieder weg.
     */
    unlist: (entry: ListedEntry) => {
      run(
        () => removeRestockItemAction(entry.id),
        () => null,
      )
    },
  }
}

export type RestockActions = ReturnType<typeof restockActions>

export function useRestockActions() {
  const [notice, setNotice] = useState<RestockNotice | null>(null)
  const [isPending, startTransition] = useTransition()
  const isOnline = useIsOnline()

  function run<T extends object>(
    action: () => Promise<RestockActionResult<T>>,
    noticeAfter: (success: Success<T>) => RestockNotice | null,
  ) {
    if (!isOnline) {
      setNotice({ kind: 'error', message: OFFLINE_WRITE_MESSAGE })
      return
    }
    setNotice(null)
    startTransition(async () => {
      const result = await action()
      setNotice(
        isFailure(result) ? { kind: 'error', message: result.message } : noticeAfter(result),
      )
    })
  }

  const dismiss = () => {
    setNotice(null)
  }

  return { notice, dismiss, actions: restockActions(run), isLocked: isPending || !isOnline }
}
