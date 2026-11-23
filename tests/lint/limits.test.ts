import type { Linter } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'
import { createFixtureLinter, lintFixtures } from './run-eslint'

const rejectedFixtures = [
  { file: 'max-lines.ts', ruleId: 'max-lines' },
  { file: 'max-lines-per-function.ts', ruleId: 'max-lines-per-function' },
  { file: 'max-lines-per-function-tsx.tsx', ruleId: 'max-lines-per-function' },
  { file: 'complexity.ts', ruleId: 'complexity' },
  { file: 'max-depth.ts', ruleId: 'max-depth' },
  { file: 'max-params.ts', ruleId: 'max-params' },
  { file: 'max-nested-callbacks.ts', ruleId: 'max-nested-callbacks' },
  { file: 'no-console.ts', ruleId: 'no-console' },
  { file: 'no-nested-ternary.ts', ruleId: 'no-nested-ternary' },
  { file: 'eqeqeq.ts', ruleId: 'eqeqeq' },
  { file: 'no-restricted-properties.ts', ruleId: 'no-restricted-properties' },
  { file: 'jsx-max-depth.tsx', ruleId: 'react/jsx-max-depth' },
  { file: 'no-multi-comp.tsx', ruleId: 'react/no-multi-comp' },
  {
    file: 'switch-exhaustiveness-check.ts',
    ruleId: '@typescript-eslint/switch-exhaustiveness-check',
  },
  { file: 'consistent-type-imports.ts', ruleId: '@typescript-eslint/consistent-type-imports' },
  { file: 'no-default-export.ts', ruleId: 'import/no-default-export' },
  {
    file: 'require-description.ts',
    ruleId: '@eslint-community/eslint-comments/require-description',
  },
] as const

const CLEAN_FIXTURE = 'clean.ts'

let messagesByFile: ReadonlyMap<string, Linter.LintMessage[]> = new Map()

// Typbasierte Regeln brauchen das TypeScript-Programm des ganzen Projekts. Allein entsteht es in
// rund 3 s, im Pre-Push neben allen anderen Testdateien dauerte schon das Aufwärmen über 60 s.
// Darum großzügig 3 Minuten: Das Limit fängt nur einen hängenden Lauf.
const LINT_ALL_TIMEOUT_MS = 180_000

// Alle Fixtures in einem Aufruf: Das TypeScript-Programm entsteht einmal (#244).
beforeAll(async () => {
  const files = [...rejectedFixtures.map(({ file }) => file), CLEAN_FIXTURE]
  messagesByFile = await lintFixtures(
    createFixtureLinter(),
    files.map((file) => `limits/${file}`),
  )
}, LINT_ALL_TIMEOUT_MS)

const messagesOf = (file: string) => messagesByFile.get(`limits/${file}`)

describe('harte Linter-Grenzen', () => {
  it.each(rejectedFixtures)('lehnt $file über $ruleId ab', ({ file, ruleId }) => {
    expect(messagesOf(file)?.map((message) => message.ruleId)).toContain(ruleId)
  })

  it('lässt eine saubere Datei ohne Meldung durch', () => {
    expect(messagesOf(CLEAN_FIXTURE)).toEqual([])
  })
})
