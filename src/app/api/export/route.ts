// Export als JSON zum Herunterladen (#80, SYS-01). Nur ein Admin des Haushalts bekommt die Datei;
// alle anderen bekommen 404 wie bei den Admin-Seiten, damit nichts über den Export verraten wird.
import { exportHouseholdNow } from '@/features/system/application/export-household'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { errorResponse } from '@/shared/lib/http'

const NOT_FOUND = 'Nicht gefunden.'

export async function GET(): Promise<Response> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return errorResponse(404, NOT_FOUND)
  const result = await exportHouseholdNow(admin.value.householdId)
  if (!result.ok) return errorResponse(404, NOT_FOUND)
  const { fileName, content } = result.value
  return new Response(`${JSON.stringify(content, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${fileName}"`,
      'cache-control': 'private, no-store',
    },
  })
}
