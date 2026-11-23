import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy } from './security-headers'

const directives = (policy: string) =>
  new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...values] = directive.split(' ')
      return [name, values.join(' ')]
    }),
  )

describe('buildContentSecurityPolicy', () => {
  it('erlaubt im Produktionsbuild Skripte und Styles nur mit Nonce', () => {
    const policy = directives(buildContentSecurityPolicy({ nonce: 'abc123', isDevelopment: false }))

    expect(policy.get('script-src')).toBe("'self' 'nonce-abc123' 'strict-dynamic'")
    expect(policy.get('style-src')).toBe("'self' 'nonce-abc123'")
    expect(policy.get('connect-src')).toBe("'self'")
  })

  it('verbietet Einbetten, Plugins und fremde Formularziele', () => {
    const policy = directives(buildContentSecurityPolicy({ nonce: 'n', isDevelopment: false }))

    expect(policy.get('frame-ancestors')).toBe("'none'")
    expect(policy.get('object-src')).toBe("'none'")
    expect(policy.get('form-action')).toBe("'self'")
    expect(policy.get('base-uri')).toBe("'self'")
  })

  it('erlaubt den eigenen Service Worker trotz strict-dynamic', () => {
    const policy = directives(buildContentSecurityPolicy({ nonce: 'n', isDevelopment: false }))

    expect(policy.get('worker-src')).toBe("'self'")
  })

  it('lockert nur im Dev-Server eval, inline Styles und WebSocket', () => {
    const dev = buildContentSecurityPolicy({ nonce: 'n', isDevelopment: true })
    const production = buildContentSecurityPolicy({ nonce: 'n', isDevelopment: false })

    expect(dev).toContain("'unsafe-eval'")
    expect(directives(dev).get('style-src')).toBe("'self' 'unsafe-inline'")
    expect(directives(dev).get('connect-src')).toBe("'self' ws: wss:")
    expect(production).not.toContain("'unsafe-eval'")
    expect(directives(production).get('style-src')).not.toContain("'unsafe-inline'")
  })
})
