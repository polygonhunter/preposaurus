// Großer Haushalt für die Laufzeit-Grenze der Lesepfade (#141): viele Produkte über alle
// System-Lebensmittelarten verteilt, je Produkt mehrere Packungen mit gestreuten Daten. Die Werte
// sind frei erfunden. Erzeugt wird in SQL (generate_series), damit das Einspielen schnell bleibt.
import { sql } from 'drizzle-orm'
import { buildCapture, buildUser } from '../../../db/seeds/factories'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { captures } from '../../../src/server/db/schema/confirmed-captures'

interface LargeHousehold {
  householdId: string
  products: number
  unitsPerProduct: number
}

async function insertProducts(db: Database, { householdId, products }: LargeHousehold) {
  await db.execute(sql`
    with arten as (
      select id, kategorie_id, row_number() over (order by schluessel) - 1 as nr,
        count(*) over () as anzahl
      from lebensmittelart where haushalt_id is null
    )
    insert into produkt (id, haushalt_id, kategorie_id, lebensmittelart_id, bezeichnung,
      inhalt_wert, inhalt_einheit)
    select gen_random_uuid(), ${householdId}, arten.kategorie_id, arten.id, 'Produkt ' || g,
      250 + (g % 4) * 250, 'g'
    from generate_series(1, ${products}) as g
    join arten on arten.nr = g % arten.anzahl`)
}

async function insertUnits(db: Database, input: LargeHousehold, captureId: string) {
  // Rund jede siebte Packung ohne Datum, die übrigen über drei Jahre um den Stichtag gestreut.
  // Die Streuung hängt an Produkt und Packung (hashtext), damit sie wie echte Daten verteilt ist.
  await db.execute(sql`
    insert into einheit (id, produkt_id, mhd, mhd_genauigkeit, erfassung_id)
    select gen_random_uuid(), produkt_id,
      case when streuung % 7 = 0 then null else date '2026-01-01' + streuung % 1100 end,
      case when streuung % 7 = 0 then null else 'tag' end,
      ${captureId}
    from (
      select produkt.id as produkt_id, abs(hashtext(produkt.id::text || '-' || n)) as streuung
      from produkt
      cross join generate_series(1, ${input.unitsPerProduct}) as n
      where produkt.haushalt_id = ${input.householdId}
    ) as packung`)
}

/** Ergänzt den Haushalt um `products` Produkte mit je `unitsPerProduct` Packungen im Vorrat. */
export async function fillLargeHousehold(db: Database, input: LargeHousehold): Promise<void> {
  const user = buildUser({ householdId: input.householdId })
  await db.insert(users).values(user)
  const capture = buildCapture({ householdId: input.householdId, userId: user.id })
  await db.insert(captures).values(capture)
  await insertProducts(db, input)
  await insertUnits(db, input, capture.id)
}
