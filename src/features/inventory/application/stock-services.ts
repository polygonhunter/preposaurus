// Verdrahtung für Seiten und Actions: echte Repositories auf der Verbindung des Serverprozesses
// und der Stichtag in Berlin. Die Use-Cases selbst bekommen ihre Ports weiter übergeben.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import { createStockReadRepository } from '../data/stock-read-repository'
import type { StockReader } from './stock-reader'

export interface StockServices {
  reader: StockReader
  today: CalendarDay
  now: Date
}

export async function stockServices(): Promise<StockServices> {
  const db = await getDb()
  const now = new Date()
  return {
    reader: createStockReadRepository(db),
    today: todayInBerlin(now),
    now,
  }
}
