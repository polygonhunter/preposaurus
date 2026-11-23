import { describe, expect, it } from 'vitest'
import { shouldShowInstallHint } from './install-hint'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.7444.77 Mobile/15E148 Safari/604.1'
const IPHONE_FIREFOX =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/145.0 Mobile/15E148 Safari/605.1.15'
const IPHONE_WEBVIEW =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'

describe('shouldShowInstallHint', () => {
  const facts = { userAgent: IPHONE_SAFARI, isStandalone: false, isDismissed: false }

  it('zeigt den Hinweis im iPhone-Safari', () => {
    expect(shouldShowInstallHint(facts)).toBe(true)
  })

  it('zeigt ihn nicht in der installierten App', () => {
    expect(shouldShowInstallHint({ ...facts, isStandalone: true })).toBe(false)
  })

  it('zeigt ihn nach dem Ausblenden nicht mehr', () => {
    expect(shouldShowInstallHint({ ...facts, isDismissed: true })).toBe(false)
  })

  it('zeigt ihn nicht in anderen Browsern und eingebetteten Webansichten auf dem iPhone', () => {
    for (const userAgent of [IPHONE_CHROME, IPHONE_FIREFOX, IPHONE_WEBVIEW]) {
      expect(shouldShowInstallHint({ ...facts, userAgent })).toBe(false)
    }
  })

  it('zeigt ihn nicht auf iPad, Mac und Android', () => {
    for (const userAgent of [IPAD_SAFARI, ANDROID_CHROME]) {
      expect(shouldShowInstallHint({ ...facts, userAgent })).toBe(false)
    }
  })
})
