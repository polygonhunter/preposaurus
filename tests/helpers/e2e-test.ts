import { test as base, expect } from '@playwright/test'
import { emulateFold, type FoldOptions } from './fold'

// Jede Seite in jedem E2E-Test läuft ohne Verstoß gegen die CSP (#198). Chromium und WebKit melden
// blockierte Skripte, Styles, Bilder oder Worker in der Konsole mit „Content Security Policy“.
// Erfasst werden alle Seiten des Standard-Kontexts, auch neu geöffnete Tabs.
const CSP_MARKER = 'Content Security Policy'

export const test = base.extend<{ cspGuard: undefined } & FoldOptions>({
  // Projekte mit Falz (duo-quer) stellen sie vor jedem Test nach (tests/helpers/fold.ts, #253)
  fold: [null, { option: true }],
  page: async ({ page, fold, isMobile }, provide) => {
    if (fold !== null) await emulateFold(page, { fold, isMobile })
    await provide(page)
  },
  cspGuard: [
    async ({ context }, use) => {
      const violations: string[] = []
      context.on('console', (message) => {
        if (message.text().includes(CSP_MARKER)) violations.push(message.text())
      })
      await use(undefined)
      expect(violations, 'Verstöße gegen die Content Security Policy').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
