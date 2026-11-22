// Schichtgrenzen nach CODE_PRINZIPIEN §2. Jede Policy entspricht einer Zeile der Importtabelle.
import boundaries from 'eslint-plugin-boundaries'

const FEATURE_LAYERS = ['ui', 'actions', 'application', 'domain', 'data']

const elements = [
  { type: 'app', pattern: 'src/app' },
  ...FEATURE_LAYERS.map((type) => ({
    type,
    pattern: `src/features/*/${type}`,
    capture: ['feature'],
  })),
  { type: 'server', pattern: 'src/server/*', capture: ['module'] },
  { type: 'shared', pattern: 'src/shared/*', capture: ['module'] },
  { type: 'worker', pattern: 'src/worker' },
  // Test-Helfer (Fabriken, Fakes) liegen außerhalb von src/ und werden nicht ausgeliefert
  { type: 'test-helpers', pattern: 'tests/helpers' },
]

// schemas.ts ist eine Datei, kein Ordner. Darum ein Datei-Deskriptor statt eines Elements.
const files = [
  { pattern: '**/src/features/*/schemas.ts', category: 'schemas', capture: ['root', 'feature'] },
  // Einstieg von Next beim Serverstart (prüft env, startet Logger)
  { pattern: '**/src/instrumentation.ts', category: 'instrumentation' },
]

const element = (type, captured) => ({ element: captured ? { type, captured } : { type } })
const sameFeature = (type) => element(type, { feature: '{{ from.element.captured.feature }}' })
const serverModule = (module) => element('server', { module })
const schemas = { file: { categories: 'schemas' } }
const anyShared = element('shared')
const typesOnly = (to) => ({ to, dependency: { kind: 'type' } })
const to = (target) => ({ to: target })

// Fremde Features: nur application/, schemas.ts und domain/-Typen.
const domainSameOrTypes = [to(sameFeature('domain')), typesOnly(element('domain'))]

const policies = [
  {
    from: element(['app', 'ui', 'actions', 'application', 'data', 'server', 'shared', 'worker']),
    allow: to({ module: { origin: ['external', 'core'] } }),
  },
  { from: schemas, allow: [to({ module: { origin: ['external', 'core'] } }), to(anyShared)] },
  { from: { file: { categories: 'instrumentation' } }, allow: [to(anyShared)] },
  {
    from: element('app'),
    allow: [
      to(element(['ui', 'actions', 'application', 'domain'])),
      to(schemas),
      to(serverModule('auth')),
      to(anyShared),
    ],
  },
  {
    from: element('ui'),
    allow: [
      to(sameFeature('ui')),
      to(sameFeature('actions')),
      ...domainSameOrTypes,
      to(schemas),
      to(anyShared),
    ],
  },
  {
    from: element('actions'),
    allow: [
      to(element('application')),
      ...domainSameOrTypes,
      to(schemas),
      to(serverModule('auth')),
      to(anyShared),
    ],
  },
  {
    from: element('application'),
    allow: [
      to(element('application')),
      ...domainSameOrTypes,
      to(sameFeature('data')),
      to(schemas),
      to(element('server')),
      to(anyShared),
    ],
  },
  {
    from: element('domain'),
    allow: [
      ...domainSameOrTypes,
      to(element('shared', { module: 'lib' })),
      // Wertelisten (z. B. Behälter-Schlüssel) nur als Typ, damit es eine Liste gibt
      typesOnly(element('shared', { module: 'config' })),
    ],
  },
  {
    from: element('data'),
    allow: [
      typesOnly(element('domain')),
      to(sameFeature('data')),
      to(serverModule('db')),
      to(anyShared),
    ],
  },
  {
    from: element('server'),
    allow: [typesOnly(element('domain')), to(schemas), to(element('server')), to(anyShared)],
  },
  { from: element('shared'), allow: to(anyShared) },
  {
    from: element('worker'),
    allow: [to(element('application')), to(element('server')), to(anyShared)],
  },
  {
    from: element('test-helpers'),
    allow: [
      to({ module: { origin: ['external', 'core'] } }),
      to(element(['test-helpers', 'domain'])),
      // Test-DB, Schema und Fixtures für die Integrationstests (M1)
      to(serverModule('db')),
      // Fake-Adapter brauchen den Port, den sie nachbilden
      to(serverModule('storage')),
      to(anyShared),
    ],
  },
]

const testRunnerPolicy = {
  from: element(['ui', 'actions', 'application', 'domain', 'data', 'server', 'shared', 'worker']),
  allow: [to({ module: { origin: 'external', source: 'vitest' } }), to(element('test-helpers'))],
}

export const boundariesConfig = [
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/files': files,
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', checkAllOrigins: true, policies },
      ],
    },
  },
  {
    // Tests neben dem Code (z. B. domain/*.test.ts) brauchen vitest, der Code selbst nicht.
    files: ['src/**/*.test.{ts,tsx}', 'tests/lint/fixtures/boundaries/src/**/*.test.{ts,tsx}'],
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', checkAllOrigins: true, policies: [...policies, testRunnerPolicy] },
      ],
    },
  },
  {
    // Ohne diese Regeln wären Dateien außerhalb der Schichten (Barrel-index.ts, src/lib/…)
    // ein ungeprüfter Umweg, z. B. ui → index.ts → data.
    files: ['src/**/*.{ts,tsx}', 'tests/lint/fixtures/boundaries/**/*.{ts,tsx}'],
    rules: {
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
    },
  },
]
