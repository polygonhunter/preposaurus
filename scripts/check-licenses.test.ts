import { describe, expect, it } from 'vitest'
import { ALLOWED_LICENSES, findViolations, isLicenseAllowed } from './check-licenses'

describe('isLicenseAllowed', () => {
  it.each(['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause', '0BSD', 'MIT-0'])(
    'erlaubt %s',
    (license) => {
      expect(isLicenseAllowed(license, ALLOWED_LICENSES)).toBe(true)
    },
  )

  it.each(['GPL-3.0-only', 'LGPL-3.0-or-later', 'MPL-2.0', 'CC-BY-4.0', 'UNKNOWN'])(
    'lehnt %s ab',
    (license) => {
      expect(isLicenseAllowed(license, ALLOWED_LICENSES)).toBe(false)
    },
  )

  it('erlaubt eine OR-Wahl, wenn eine Seite erlaubt ist', () => {
    expect(isLicenseAllowed('(MIT OR GPL-3.0-only)', ALLOWED_LICENSES)).toBe(true)
  })

  it('verlangt bei AND alle Lizenzen', () => {
    expect(isLicenseAllowed('MIT AND GPL-3.0-only', ALLOWED_LICENSES)).toBe(false)
    expect(isLicenseAllowed('(MIT AND Apache-2.0)', ALLOWED_LICENSES)).toBe(true)
  })

  it('wertet Klammern vor AND aus', () => {
    expect(isLicenseAllowed('(MIT OR Apache-2.0) AND CC-BY-4.0', ALLOWED_LICENSES)).toBe(false)
    expect(isLicenseAllowed('(MIT OR GPL-3.0-only) AND ISC', ALLOWED_LICENSES)).toBe(true)
  })

  it('lässt AND stärker binden als OR', () => {
    expect(isLicenseAllowed('MIT OR GPL-3.0-only AND CC-BY-4.0', ALLOWED_LICENSES)).toBe(true)
    expect(isLicenseAllowed('GPL-3.0-only OR MIT AND CC-BY-4.0', ALLOWED_LICENSES)).toBe(false)
  })

  it('erlaubt einen WITH-Zusatz nur, wenn er genau so erlaubt ist', () => {
    const withClasspath = 'GPL-2.0-only WITH Classpath-exception-2.0'

    expect(isLicenseAllowed(withClasspath, ALLOWED_LICENSES)).toBe(false)
    expect(isLicenseAllowed(withClasspath, [withClasspath])).toBe(true)
  })

  it.each(['(MIT', 'MIT)', 'MIT OR', 'AND MIT', '', 'MIT Apache-2.0'])(
    'lehnt den unlesbaren Ausdruck "%s" ab',
    (expression) => {
      expect(isLicenseAllowed(expression, ALLOWED_LICENSES)).toBe(false)
    },
  )
})

describe('findViolations', () => {
  const libvips = {
    name: '@img/sharp-libvips-linux-x64',
    version: '1.0.0',
    license: 'LGPL-3.0-or-later',
  }
  const exception = { package: '@img/sharp-libvips-*', license: 'LGPL-3.0-or-later', reason: 'U2' }

  it('lässt Pakete aus der Ausnahmedatei durch, auch per Präfix', () => {
    expect(findViolations([libvips], [exception])).toEqual([])
  })

  it('meldet eine Ausnahme nicht mehr, wenn sich die Lizenz geändert hat', () => {
    const changed = { ...libvips, license: 'GPL-3.0-only' }

    expect(findViolations([changed], [exception])).toEqual([changed])
  })

  it('lässt einen gemischten Ausdruck nur mit Ausnahme für den nicht erlaubten Teil durch', () => {
    const mixed = {
      name: 'mixed-lib',
      version: '1.0.0',
      license: '(MIT OR Apache-2.0) AND CC-BY-4.0',
    }
    const ccException = { package: 'mixed-lib', license: 'CC-BY-4.0', reason: 'Daten' }
    const otherPackage = { ...ccException, package: 'andere-lib' }

    expect(findViolations([mixed], [])).toEqual([mixed])
    expect(findViolations([mixed], [otherPackage])).toEqual([mixed])
    expect(findViolations([mixed], [ccException])).toEqual([])
  })

  it('meldet nicht erlaubte Lizenzen ohne Ausnahme', () => {
    const copyleft = { name: 'copyleft-lib', version: '2.0.0', license: 'GPL-3.0-only' }

    expect(findViolations([copyleft, { ...copyleft, name: 'ok', license: 'MIT' }], [])).toEqual([
      copyleft,
    ])
  })
})
