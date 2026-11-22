import { dirname, relative } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { fixturePath, lintTextAs, warmUpEslint } from './run-eslint'

beforeAll(warmUpEslint)

const featureFile = (feature: string, layer: string): string =>
  `src/features/${feature}/${layer}/${layer}-module.ts`

const modules: Record<string, string> = {
  app: 'src/app/entry.ts',
  worker: 'src/worker/main.ts',
  'server/auth': 'src/server/auth/session.ts',
  'server/db': 'src/server/db/client.ts',
  'server/ai': 'src/server/ai/recognizer.ts',
  'shared/lib': 'src/shared/lib/helper.ts',
  'shared/ui': 'src/shared/ui/widget.ts',
  'shared/config': 'src/shared/config/settings.ts',
  schemas: 'src/features/alpha/schemas.ts',
  'beta/schemas': 'src/features/beta/schemas.ts',
  barrel: 'src/features/alpha/index.ts',
  'lib/unknown': 'src/lib/unknown.ts',
  instrumentation: 'src/instrumentation.ts',
}
for (const layer of ['ui', 'actions', 'application', 'domain', 'data']) {
  modules[layer] = featureFile('alpha', layer)
  modules[`beta/${layer}`] = featureFile('beta', layer)
}

const EXTERNAL = new Set(['react', 'node:fs'])

type ImportCase = readonly [from: string, to: string, kind: 'value' | 'type', allowed: boolean]

const fileOf = (name: string): string => {
  const file = modules[name]
  if (file === undefined) throw new Error(`Unbekanntes Modul ${name}`)
  return `boundaries/${file}`
}

function specifierFor(from: string, to: string): string {
  if (EXTERNAL.has(to)) return to
  const path = relative(dirname(fixturePath(fileOf(from))), fixturePath(fileOf(to)))
  const withoutExtension = path.replace(/\.ts$/, '')
  return withoutExtension.startsWith('.') ? withoutExtension : `./${withoutExtension}`
}

function importCode(from: string, to: string, kind: 'value' | 'type'): string {
  const specifier = specifierFor(from, to)
  if (EXTERNAL.has(to))
    return `import * as external from '${specifier}'\nexport const probe = external\n`
  return kind === 'type'
    ? `import type { Marker } from '${specifier}'\nexport type Probe = Marker\n`
    : `import { marker } from '${specifier}'\nexport const probe = marker\n`
}

const cases: readonly ImportCase[] = [
  ['app', 'ui', 'value', true],
  ['app', 'actions', 'value', true],
  ['app', 'application', 'value', true],
  ['app', 'domain', 'value', true],
  ['app', 'schemas', 'value', true],
  ['app', 'server/auth', 'value', true],
  ['app', 'server/db', 'value', false],
  ['app', 'data', 'value', false],
  ['app', 'shared/ui', 'value', true],
  ['ui', 'actions', 'value', true],
  ['ui', 'beta/ui', 'value', false],
  ['ui', 'beta/actions', 'value', false],
  ['ui', 'application', 'value', false],
  ['ui', 'domain', 'value', true],
  ['ui', 'beta/domain', 'value', false],
  ['ui', 'beta/domain', 'type', true],
  ['ui', 'data', 'value', false],
  ['ui', 'schemas', 'value', true],
  ['ui', 'beta/schemas', 'value', true],
  ['ui', 'server/auth', 'value', false],
  ['ui', 'shared/ui', 'value', true],
  ['ui', 'react', 'value', true],
  ['actions', 'ui', 'value', false],
  ['actions', 'application', 'value', true],
  ['actions', 'beta/application', 'value', true],
  ['actions', 'domain', 'value', true],
  ['actions', 'data', 'value', false],
  ['actions', 'schemas', 'value', true],
  ['actions', 'server/auth', 'value', true],
  ['actions', 'server/db', 'value', false],
  ['actions', 'shared/lib', 'value', true],
  ['application', 'ui', 'value', false],
  ['application', 'actions', 'value', false],
  ['application', 'beta/application', 'value', true],
  ['application', 'domain', 'value', true],
  ['application', 'data', 'value', true],
  ['application', 'beta/data', 'value', false],
  ['application', 'server/ai', 'value', true],
  ['application', 'server/db', 'value', true],
  ['application', 'schemas', 'value', true],
  ['application', 'shared/lib', 'value', true],
  ['domain', 'beta/domain', 'type', true],
  ['domain', 'beta/domain', 'value', false],
  ['domain', 'shared/lib', 'value', true],
  ['domain', 'shared/ui', 'value', false],
  ['domain', 'shared/config', 'value', false],
  ['domain', 'data', 'value', false],
  ['domain', 'schemas', 'value', false],
  ['domain', 'react', 'value', false],
  ['domain', 'node:fs', 'value', false],
  ['data', 'domain', 'value', false],
  ['data', 'domain', 'type', true],
  ['data', 'server/db', 'value', true],
  ['data', 'server/ai', 'value', false],
  ['data', 'application', 'value', false],
  ['data', 'schemas', 'value', false],
  ['data', 'beta/data', 'value', false],
  ['data', 'shared/lib', 'value', true],
  ['server/ai', 'domain', 'type', true],
  ['server/ai', 'domain', 'value', false],
  ['server/ai', 'schemas', 'value', true],
  ['server/ai', 'server/db', 'value', true],
  ['server/ai', 'application', 'value', false],
  ['server/ai', 'ui', 'value', false],
  ['shared/lib', 'shared/config', 'value', true],
  ['shared/lib', 'domain', 'value', false],
  ['shared/lib', 'server/db', 'value', false],
  ['shared/lib', 'ui', 'value', false],
  ['schemas', 'shared/lib', 'value', true],
  ['schemas', 'react', 'value', true],
  ['schemas', 'domain', 'value', false],
  ['schemas', 'data', 'value', false],
  ['worker', 'application', 'value', true],
  ['worker', 'server/db', 'value', true],
  ['worker', 'ui', 'value', false],
  ['worker', 'domain', 'value', false],
  ['instrumentation', 'shared/config', 'value', true],
  ['instrumentation', 'data', 'value', false],
]

describe('Schichtgrenzen', () => {
  const rows = cases.map(([from, to, kind, allowed]) => ({ from, to, kind, allowed }))

  it.each(rows)('$from → $to ($kind): erlaubt = $allowed', async ({ from, to, kind, allowed }) => {
    const messages = await lintTextAs({ code: importCode(from, to, kind), asFile: fileOf(from) })

    expect(messages.filter((message) => message.fatal)).toEqual([])
    const ruleIds = messages.map((message) => message.ruleId)
    if (allowed) expect(ruleIds).not.toContain('boundaries/dependencies')
    else expect(ruleIds).toContain('boundaries/dependencies')
  })
})

describe('Umwege über Dateien außerhalb der Schichten', () => {
  const detours = [
    { from: 'ui', to: 'barrel', ruleId: 'boundaries/no-unknown-dependencies' },
    { from: 'ui', to: 'lib/unknown', ruleId: 'boundaries/no-unknown-dependencies' },
    { from: 'barrel', to: 'data', ruleId: 'boundaries/no-unknown-files' },
    { from: 'lib/unknown', to: 'data', ruleId: 'boundaries/no-unknown-files' },
  ]

  it.each(detours)('lehnt $from → $to über $ruleId ab', async ({ from, to, ruleId }) => {
    const messages = await lintTextAs({ code: importCode(from, to, 'value'), asFile: fileOf(from) })

    expect(messages.map((message) => message.ruleId)).toContain(ruleId)
  })

  it.each(['app', 'schemas', 'instrumentation', 'ui', 'shared/lib'])(
    'kennt %s als Datei einer Schicht',
    async (from) => {
      const code = importCode(from, 'shared/config', 'value')
      const messages = await lintTextAs({ code, asFile: fileOf(from) })
      const ruleIds = messages.map((message) => message.ruleId)

      expect(ruleIds).not.toContain('boundaries/no-unknown-files')
      expect(ruleIds).not.toContain('boundaries/no-unknown-dependencies')
    },
  )
})

describe('Tests neben dem Code', () => {
  const vitestImport = "import { expect } from 'vitest'\nexport const probe = expect\n"

  it('erlaubt vitest in einer Testdatei der Fachlogik', async () => {
    const asFile = 'boundaries/src/features/alpha/domain/domain-module.test.ts'
    const messages = await lintTextAs({ code: vitestImport, asFile })

    expect(messages.filter((message) => message.fatal)).toEqual([])
    expect(messages.map((message) => message.ruleId)).not.toContain('boundaries/dependencies')
  })

  it('verbietet vitest im Code der Fachlogik', async () => {
    const messages = await lintTextAs({ code: vitestImport, asFile: fileOf('domain') })

    expect(messages.map((message) => message.ruleId)).toContain('boundaries/dependencies')
  })
})
