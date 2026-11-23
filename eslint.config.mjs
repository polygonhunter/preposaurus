import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { boundariesConfig } from './eslint/boundaries.mjs'

const SKIP_BLANK_AND_COMMENTS = { skipBlankLines: true, skipComments: true }

export default defineConfig([
  ...nextVitals,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    rules: {
      // Das Plugin registriert eslint-config-next schon, hier nur die strengen Regeln.
      ...jsxA11y.flatConfigs.strict.rules,
      'max-lines': ['error', { max: 300, ...SKIP_BLANK_AND_COMMENTS }],
      'max-lines-per-function': ['error', { max: 40, ...SKIP_BLANK_AND_COMMENTS }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'no-console': 'error',
      'no-nested-ternary': 'error',
      eqeqeq: 'error',
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Nur über shared/config/env.ts' },
      ],
      'react/jsx-max-depth': ['error', { max: 6 }],
      'react/no-multi-comp': 'warn',
      'import/no-default-export': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: { 'max-lines-per-function': ['error', { max: 80, ...SKIP_BLANK_AND_COMMENTS }] },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/e2e/**', 'tests/helpers/**'],
    rules: { 'max-lines-per-function': 'off', 'max-nested-callbacks': 'off' },
  },
  {
    files: ['src/app/**', '*.config.*'],
    rules: { 'import/no-default-export': 'off' },
  },
  {
    // playwright.config.ts gehört zum Werkzeug, nicht zur App: Es liest nur CI.
    files: ['src/shared/config/env.ts', 'playwright.config.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  comments.recommended,
  {
    // CODE_PRINZIPIEN §3: Ein eslint-disable braucht eine Begründung (`-- weil …`).
    rules: { '@eslint-community/eslint-comments/require-description': 'error' },
  },
  boundariesConfig,
  prettier,
  globalIgnores([
    // Arbeitskopien der Agenten (git worktree), nicht Teil des Projekts
    '.claude/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'db/migrations/**',
    'prototypes/**',
    'tests/lint/fixtures/**',
    // Erzeugt aus src/shared/sw (scripts/build-sw.ts)
    'public/sw.js',
  ]),
])
