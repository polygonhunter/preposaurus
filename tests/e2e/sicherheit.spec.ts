// Sicherheits-Header und CSP (#198). Dass keine Seite gegen die CSP verstößt, prüft der Helfer
// tests/helpers/e2e-test.ts in jedem Test. Hier stehen die Header selbst und ein Gang über alle
// Hauptseiten in Chromium und WebKit (Kamera: erfassen-foto.spec.ts, Service Worker: pwa.spec.ts).
import { expect, test } from '../helpers/e2e-test'
import { signedOut } from '../helpers/e2e-auth'

const MAIN_PAGES = [
  '/uebersicht',
  '/uebersicht/bald-faellig',
  '/vorrat',
  '/nachkaufen',
  '/statistik',
  '/neu/manuell',
  '/einstellungen',
  '/einstellungen/konto',
  '/einstellungen/mitglieder',
  '/einstellungen/nutzer',
  '/einstellungen/regeln',
  '/einstellungen/system',
  '/einstellungen/ziel',
  '/einstellungen/foto-erkennung',
]

const nonceOf = (policy: string) => /'nonce-([^']+)'/.exec(policy)?.[1]

test.describe('Header jeder Seite', () => {
  test('setzen CSP mit frischer Nonce und die allgemeinen Sicherheits-Header', async ({ page }) => {
    const first = await page.goto('/uebersicht')
    const headers = first?.headers() ?? {}
    const policy = headers['content-security-policy'] ?? ''

    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("worker-src 'self'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('same-origin')
    expect(headers['permissions-policy']).toContain('camera=(self)')
    expect(headers['x-frame-options']).toBe('DENY')

    const nonce = nonceOf(policy)
    expect(nonce).toBeTruthy()
    const scripts = page.locator('script[src^="/_next/"]')
    expect(await scripts.count()).toBeGreaterThan(0)
    for (const script of await scripts.all()) {
      // Browser verstecken das Attribut nach dem Laden, die Eigenschaft bleibt lesbar
      expect(await script.evaluate((element: HTMLScriptElement) => element.nonce)).toBe(nonce)
    }

    const second = await page.goto('/uebersicht')
    expect(nonceOf(second?.headers()['content-security-policy'] ?? '')).not.toBe(nonce)
  })

  test('/sw.js behält seine eigene CSP und wird nie zwischengespeichert', async ({ request }) => {
    const response = await request.get('/sw.js')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-security-policy']).toBe(
      "default-src 'self'; script-src 'self'",
    )
    expect(response.headers()['cache-control']).toBe('no-cache, no-store, must-revalidate')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('API-Antworten haben die allgemeinen Header ohne Seiten-CSP', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['content-security-policy']).toBeUndefined()
  })
})

test.describe('ohne Anmeldung', () => {
  test.use(signedOut)

  test('auch die Anmeldeseite hat CSP und Rahmenverbot', async ({ page }) => {
    const response = await page.goto('/anmelden')

    expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
  })
})

test('alle Hauptseiten laden ohne Verstoß gegen die CSP', async ({ page }, testInfo) => {
  test.skip(!['desktop', 'iphone'].includes(testInfo.project.name), 'je eine Engine reicht')
  for (const path of MAIN_PAGES) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.getByRole('heading', { level: 1 }).first(), path).toBeVisible()
  }
})
