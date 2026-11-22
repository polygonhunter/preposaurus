// Prüft die Lizenzen aller Produktionsabhängigkeiten gegen eine Erlaubnisliste (UMSETZUNG M0-07).
// Aufruf: node scripts/check-licenses.ts
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

export const ALLOWED_LICENSES = [
  'MIT',
  'MIT-0',
  'Apache-2.0',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
]

export type LicenseException = Readonly<{ package: string; license: string; reason: string }>
export type InstalledPackage = Readonly<{ name: string; version: string; license: string }>

// Kleiner Parser für SPDX-Ausdrücke. Grammatik (AND bindet stärker als OR):
//   or  := and ("OR" and)*
//   and := atom ("AND" atom)*
//   atom := "(" or ")" | id ["WITH" zusatz]
interface Cursor {
  readonly tokens: readonly string[]
  position: number
}

const OPERATORS = new Set(['AND', 'OR', 'WITH', '(', ')'])

const tokenize = (expression: string): string[] =>
  expression
    .replace(/([()])/g, ' $1 ')
    .trim()
    .split(/\s+/)

const peek = (cursor: Cursor): string | undefined => cursor.tokens[cursor.position]

function take(cursor: Cursor): string | undefined {
  const token = peek(cursor)
  cursor.position += 1
  return token
}

function parseAtom(cursor: Cursor, allowed: readonly string[]): boolean {
  const token = take(cursor)
  if (token === '(') {
    const value = parseOr(cursor, allowed)
    if (take(cursor) !== ')') throw new SyntaxError('Klammer nicht geschlossen')
    return value
  }
  if (token === undefined || OPERATORS.has(token)) throw new SyntaxError('Lizenz erwartet')
  if (peek(cursor) !== 'WITH') return allowed.includes(token)
  cursor.position += 1
  return allowed.includes(`${token} WITH ${take(cursor) ?? ''}`)
}

function parseAnd(cursor: Cursor, allowed: readonly string[]): boolean {
  let result = parseAtom(cursor, allowed)
  while (peek(cursor) === 'AND') {
    cursor.position += 1
    const right = parseAtom(cursor, allowed)
    result = result && right
  }
  return result
}

function parseOr(cursor: Cursor, allowed: readonly string[]): boolean {
  let result = parseAnd(cursor, allowed)
  while (peek(cursor) === 'OR') {
    cursor.position += 1
    const right = parseAnd(cursor, allowed)
    result = result || right
  }
  return result
}

// "A OR B" reicht, wenn eine Seite erlaubt ist, "A AND B" braucht beide.
export function isLicenseAllowed(expression: string, allowed: readonly string[]): boolean {
  const cursor: Cursor = { tokens: tokenize(expression), position: 0 }
  try {
    const value = parseOr(cursor, allowed)
    return value && cursor.position === cursor.tokens.length
  } catch (error: unknown) {
    // Ein unlesbarer Ausdruck gilt als nicht erlaubt und landet so in der Fehlerliste.
    if (error instanceof SyntaxError) return false
    throw error
  }
}

const matchesPackage = (pattern: string, name: string): boolean =>
  pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : pattern === name

// Eine Ausnahme erlaubt eine einzelne Lizenz nur für das genannte Paket.
const allowedFor = (name: string, exceptions: readonly LicenseException[]): string[] => [
  ...ALLOWED_LICENSES,
  ...exceptions
    .filter((exception) => matchesPackage(exception.package, name))
    .map((e) => e.license),
]

export function findViolations(
  packages: readonly InstalledPackage[],
  exceptions: readonly LicenseException[],
): InstalledPackage[] {
  return packages.filter((pkg) => !isLicenseAllowed(pkg.license, allowedFor(pkg.name, exceptions)))
}

type QueriedPackage = Readonly<{
  name: string
  version: string
  location: string
  license?: unknown
}>

const licenseOf = (pkg: QueriedPackage): string =>
  typeof pkg.license === 'string' ? pkg.license : 'UNKNOWN'

function readProductionPackages(): InstalledPackage[] {
  const output = execFileSync('npm', ['query', '.prod'], { encoding: 'utf8' })
  const queried = JSON.parse(output) as QueriedPackage[]
  return queried
    .filter((pkg) => pkg.location !== '')
    .map((pkg) => ({ name: pkg.name, version: pkg.version, license: licenseOf(pkg) }))
}

function readExceptions(): LicenseException[] {
  const file = new URL('license-exceptions.json', import.meta.url)
  return JSON.parse(readFileSync(file, 'utf8')) as LicenseException[]
}

function main(): void {
  const packages = readProductionPackages()
  const violations = findViolations(packages, readExceptions())
  if (violations.length === 0) {
    process.stdout.write(`Lizenzen geprüft: ${String(packages.length)} Pakete, alle erlaubt.\n`)
    return
  }
  const lines = violations.map((pkg) => `  ${pkg.name}@${pkg.version}: ${pkg.license}`)
  process.stderr.write(`Nicht erlaubte Lizenzen:\n${lines.join('\n')}\n`)
  process.exitCode = 1
}

if (import.meta.main) main()
