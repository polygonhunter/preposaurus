// Adresse des Geräts für die Anmeldebremse (EINSTELLUNGEN_NUTZER §4.3). Tailscale Serve setzt
// x-forwarded-for auf genau eine Adresse und ersetzt einen Wert vom Gerät. Eine Liste mehrerer
// Adressen stammt nicht allein vom eigenen Proxy und wird wie bei Better Auth ignoriert.
import 'server-only'
import { z } from 'zod'

const ipSchema = z.union([z.ipv4(), z.ipv6()])

export function readClientIp(headers: Headers, headerName: string): string | null {
  const value = headers.get(headerName)?.trim()
  if (value === undefined || value === '') return null
  const parsed = ipSchema.safeParse(value)
  return parsed.success ? parsed.data.toLowerCase() : null
}
