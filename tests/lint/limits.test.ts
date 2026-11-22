import { describe, expect, it } from 'vitest'
import { lintFile } from './run-eslint'

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

describe('harte Linter-Grenzen', () => {
  it.each(rejectedFixtures)('lehnt $file über $ruleId ab', async ({ file, ruleId }) => {
    const messages = await lintFile(`limits/${file}`)

    expect(messages.map((message) => message.ruleId)).toContain(ruleId)
  })

  it('lässt eine saubere Datei ohne Meldung durch', async () => {
    const messages = await lintFile('limits/clean.ts')

    expect(messages).toEqual([])
  })
})
