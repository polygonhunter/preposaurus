// Ziele der Seite Nachkaufen. „Erfassen“ bzw. „Jetzt erfassen“ öffnet die Erfassung vorbelegt mit
// der Lebensmittelart des Eintrags, ohne Art mit dem Produkt (#195). Eigene Einträge ohne Produkt
// führen ins normale Erfassen.
import { prefilledCapturePath } from '@/shared/config/stock-paths'
import type { RestockItemDto } from '../schemas'

export const RESTOCK_PATHS = {
  goalSettings: '/einstellungen',
} as const

export const captureHref = (item: Pick<RestockItemDto, 'captureTarget'>) =>
  prefilledCapturePath(item.captureTarget)
