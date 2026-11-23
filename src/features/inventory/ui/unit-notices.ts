// Was nach einer Vorrat-Aktion unten steht (UX-Konzept §7): die Rückgängig-Zeile nach Verbraucht,
// Entsorgt oder „Noch gut“ (#46, #47) oder ein Fehler am Ort der Aktion. Jede Funktion ruft eine
// Action auf und übersetzt deren Antwort in genau eine solche Meldung.
import { addToRestockAction, takeBackFromRestockAction } from '../actions/add-to-restock-action'
import { consumeAction } from '../actions/consume-action'
import { discardAction } from '../actions/discard-action'
import { markStillGoodAction, undoStillGoodAction } from '../actions/still-good-action'
import { undoTakeOutAction } from '../actions/undo-take-out-action'
import type { BestBeforeDto, ConsumeRequest } from '../schemas'
import type { TakenLabel } from './consume-context'
import { formatDate, formatStillGoodMessage, formatTakenMessage } from './stock-format'

export type TakeOutNotice = Readonly<{
  kind: 'take-out'
  unitId: string
  message: string
  // Nach „Nachkaufen“ steht das Produkt auf der Liste, das zweite Angebot entfällt
  isListed: boolean
  // Von diesem Tipp angelegt: „Rückgängig“ nimmt ihn mit zurück (DATENKATALOG §5)
  addedRestockItemId: string | null
}>

type StillGoodNotice = Readonly<{
  kind: 'still-good'
  unitIds: readonly string[]
  checkedAt: string
  message: string
}>

export type UndoNotice = TakeOutNotice | StillGoodNotice
export type Notice = UndoNotice | Readonly<{ kind: 'error'; message: string }>

export const errorNotice = (message: string): Notice => ({ kind: 'error', message })

/** Schlüssel der UndoBar: Eine neue Meldung startet die fünf Sekunden neu. */
export const noticeKey = (notice: UndoNotice) =>
  notice.kind === 'take-out' ? notice.unitId : notice.unitIds.join(',')

const dateOf = (bestBefore: BestBeforeDto | null) =>
  bestBefore === null ? null : formatDate(bestBefore)

const takeOutNotice = (unitId: string, message: string): TakeOutNotice => ({
  kind: 'take-out',
  unitId,
  message,
  isListed: false,
  addedRestockItemId: null,
})

export async function runConsume(request: ConsumeRequest, { name, dateLabel }: TakenLabel) {
  const result = await consumeAction(request)
  if (!result.ok) return errorNotice(result.message)
  const date = dateLabel ?? dateOf(result.taken.bestBefore)
  return takeOutNotice(result.taken.unitId, formatTakenMessage(name, date))
}

export async function runDiscard(unitId: string, { name, dateLabel }: TakenLabel) {
  const result = await discardAction(unitId)
  if (!result.ok) return errorNotice(result.message)
  return takeOutNotice(result.unitId, formatTakenMessage(name, dateLabel ?? null, 'discarded'))
}

export async function runStillGood(unitIds: readonly string[], { name }: TakenLabel) {
  const result = await markStillGoodAction(unitIds)
  if (!result.ok) return errorNotice(result.message)
  const { checkedAt } = result
  const message = formatStillGoodMessage(name, result.unitIds.length, checkedAt)
  return { kind: 'still-good', unitIds: result.unitIds, checkedAt, message } as const
}

/** Rückgängig: holt die Packung zurück bzw. nimmt „Noch gut“ zurück. Erfolg zeigt nichts mehr. */
export async function runUndo(notice: UndoNotice): Promise<Notice | null> {
  if (notice.kind === 'still-good') {
    await undoStillGoodAction({ unitIds: notice.unitIds, checkedAt: notice.checkedAt })
    return null
  }
  const result = await undoTakeOutAction(notice.unitId)
  if (!result.ok) return errorNotice(result.message)
  if (notice.addedRestockItemId !== null) await takeBackFromRestockAction(notice.addedRestockItemId)
  return null
}

/** „Nachkaufen“ in der Rückgängig-Zeile nach Verbraucht oder Entsorgt (UX D15, #74). */
export async function runPutOnRestock(current: TakeOutNotice): Promise<Notice> {
  const result = await addToRestockAction(current.unitId)
  if (!result.ok) return errorNotice(result.message)
  return {
    ...current,
    message: result.message,
    isListed: true,
    addedRestockItemId: result.addedItemId,
  }
}
