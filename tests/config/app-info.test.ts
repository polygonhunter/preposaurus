import { describe, expect, it } from 'vitest'
import packageJson from '../../package.json'
import { APP_LICENSE, APP_VERSION } from '../../src/shared/config/app-info'

describe('app-info', () => {
  it('stimmt mit Version und Lizenz in package.json überein', () => {
    expect(APP_VERSION).toBe(packageJson.version)
    expect(APP_LICENSE).toBe(packageJson.license)
  })
})
