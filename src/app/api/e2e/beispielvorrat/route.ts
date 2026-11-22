// Nur für die E2E-Tests (tests/e2e/beispielvorrat.setup.ts): legt den Beispielvorrat in den
// Haushalt des angemeldeten Admins. Ohne E2E_DEMO_STOCK gibt es die Route nicht (404), und env.ts
// lässt den Schalter im Produktionsbuild nur in der CI zu.
import { requireAdmin } from '@/server/auth/guards'
import { loadEnv } from '@/shared/config/env'
import { seedDemoForE2e } from '../../../../../db/seeds/demo-e2e'

const NO_STORE = { 'cache-control': 'no-store' }

export async function POST(): Promise<Response> {
  if (!loadEnv().E2E_DEMO_STOCK) return new Response(null, { status: 404, headers: NO_STORE })
  const admin = await requireAdmin()
  if (!admin.ok || admin.value.householdId === null) {
    return new Response(null, { status: 403, headers: NO_STORE })
  }
  const created = await seedDemoForE2e(admin.value.householdId, admin.value.id)
  return Response.json({ created }, { headers: NO_STORE })
}
