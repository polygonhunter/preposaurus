import { and, asc, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getHistory } from '../../../src/features/inventory/application/get-history'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import {
  historyFilterSchema,
  historyPageSchema,
  type HistoryFilter,
} from '../../../src/features/inventory/schemas/history'
import { users } from '../../../src/server/db/schema/account'
import { products, units } from '../../../src/server/db/schema/inventory'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead } from './stock-read-fixtures'

// Verlauf gegen die Datenbank (#48): Zeitraumgrenzen in Berlin, Ausgang, Lebensmittelart und
// Mandantentrennung. „30 Tage“ bis zum 24.11.2026 beginnen am 26.10., also um 23 Uhr UTC am 25.10.
// Der Beispielvorrat bringt schon je eine verbrauchte und entsorgte Packung Nudeln vom 22.11. mit.
const today = toCalendarDay('2026-11-24')
const BEFORE_START = new Date('2026-10-25T22:59:59Z')
const AT_START = new Date('2026-10-25T23:00:00Z')
const LATER = new Date('2026-11-23T23:30:00Z')

describe('Verlauf des Haushalts gegen die Datenbank (#48)', () => {
  let testDb: TestDb
  let householdId: string
  let foreignId: string
  let noodlesId: string
  let alexName: string

  function unitsOf(productName: string, household: string) {
    return testDb.db
      .select({ id: units.id })
      .from(units)
      .innerJoin(products, eq(products.id, units.productId))
      .where(
        and(
          eq(products.name, productName),
          eq(products.householdId, household),
          eq(units.status, 'vorrat'),
        ),
      )
  }

  type TakeOut = Readonly<{ status: 'verbraucht' | 'entsorgt'; at: Date; by: string | null }>

  async function takeOut(unitId: string | undefined, { status, at, by }: TakeOut) {
    await testDb.db
      .update(units)
      .set({ status, takenAt: at, takenBy: by })
      .where(eq(units.id, unitId ?? ''))
  }

  async function firstUserOf(household: string) {
    const [user] = await testDb.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.householdId, household))
      .orderBy(asc(users.username))
    if (user === undefined) throw new Error('Nutzer fehlt')
    return user
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ householdId, foreignId, noodlesId } = await setupStockRead(testDb.db))
    const alex = await firstUserOf(householdId)
    alexName = alex.name
    const [early, atStart] = await unitsOf('Nudeln', householdId)
    const [walnut] = await unitsOf('Walnüsse', householdId)
    const [foreign] = await unitsOf('Fremde Spaghetti', foreignId)
    await takeOut(early?.id, { status: 'verbraucht', at: BEFORE_START, by: alex.id })
    await takeOut(atStart?.id, { status: 'verbraucht', at: AT_START, by: alex.id })
    await takeOut(walnut?.id, { status: 'entsorgt', at: LATER, by: null })
    await takeOut(foreign?.id, { status: 'entsorgt', at: LATER, by: null })
  })

  afterAll(async () => {
    await testDb.close()
  })

  async function history(filter: Partial<HistoryFilter> = {}, household = householdId) {
    const repository = createStockReadRepository(testDb.db)
    const result = await getHistory(
      { reader: repository, history: repository },
      { householdId: household, today, filter: historyFilterSchema.parse(filter) },
    )
    if (!result.ok) throw new Error('nicht gefunden')
    return historyPageSchema.parse(result.value)
  }

  const names = (page: Awaited<ReturnType<typeof history>>) =>
    page.days.map(({ day, items }) => [day, items.map((item) => [item.name, item.person])])

  it('zählt den ersten Augenblick des Zeitraums mit, eine Sekunde davor nicht', async () => {
    const page = await history()

    expect(page.from).toBe('2026-10-26')
    expect(names(page)).toEqual([
      ['2026-11-24', [['Walnüsse', null]]],
      [
        '2026-11-22',
        [
          ['Nudeln', alexName],
          ['Nudeln', alexName],
        ],
      ],
      ['2026-10-26', [['Nudeln', alexName]]],
    ])
    expect(page.counts).toEqual({ consumed: 2, discarded: 2 })
  })

  it('zeigt mit „Alles“ auch die ältere Entnahme', async () => {
    const page = await history({ period: 'all' })

    expect(page.days.map(({ day }) => day)).toEqual([
      '2026-11-24',
      '2026-11-22',
      '2026-10-26',
      '2026-10-25',
    ])
    expect(page.counts).toEqual({ consumed: 3, discarded: 2 })
  })

  it('filtert nach Ausgang und nach Lebensmittelart', async () => {
    const discarded = await history({ outcome: 'discarded', period: 'all' })
    const noodles = await history({ target: { kind: 'food-type', id: noodlesId }, period: 'all' })

    expect(names(discarded)).toEqual([
      ['2026-11-24', [['Walnüsse', null]]],
      ['2026-11-22', [['Nudeln', alexName]]],
    ])
    expect(noodles.target?.name).toBe('Nudeln')
    expect(noodles.counts).toEqual({ consumed: 3, discarded: 1 })
  })

  it('zeigt jedem Haushalt nur die eigenen Packungen', async () => {
    const foreign = await history({ period: 'all' }, foreignId)

    expect(names(foreign)).toEqual([['2026-11-24', [['Fremde Spaghetti', null]]]])
    expect(JSON.stringify(await history({ period: 'all' }))).not.toContain('Fremde')
  })

  it('kennt die Lebensmittelart eines fremden Haushalts nicht', async () => {
    const repository = createStockReadRepository(testDb.db)
    const [foreignProduct] = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.householdId, foreignId))
    const result = await getHistory(
      { reader: repository, history: repository },
      {
        householdId,
        today,
        filter: { period: 'all', target: { kind: 'product', id: foreignProduct?.id ?? '' } },
      },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
