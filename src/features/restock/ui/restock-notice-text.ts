// Text der einen Meldung unten auf Nachkaufen, für die sichtbare Leiste und die Ansage (#274).
// Rein, damit beide denselben Satz zeigen und es Tests gibt.
import type { BarAnnouncement } from '@/shared/ui/NoticeAnnouncer'
import type { RestockNotice } from './use-restock-actions'

export function restockNoticeMessage(notice: RestockNotice): string {
  switch (notice.kind) {
    case 'checked':
      return `${notice.entry.label} abgehakt.`
    case 'removed':
      return `${notice.item.label} entfernt.`
    case 'listed':
      return `${notice.entry.label} steht jetzt auf der Liste.`
    case 'hidden':
      return `${notice.entry.label} ausgeblendet.`
    case 'error':
      return notice.message
  }
}

/** Schlüssel der Meldung: Eine neue startet die fünf Sekunden der UndoBar neu und wird angesagt. */
export function restockNoticeKey(notice: RestockNotice): string {
  switch (notice.kind) {
    case 'removed':
      return `removed-${notice.item.id}`
    case 'error':
      return 'error'
    case 'checked':
    case 'listed':
    case 'hidden':
      return `${notice.kind}-${notice.entry.id}`
  }
}

export function restockAnnouncement(notice: RestockNotice | null): BarAnnouncement | null {
  if (notice === null) return null
  return {
    key: restockNoticeKey(notice),
    message: restockNoticeMessage(notice),
    isError: notice.kind === 'error',
  }
}
