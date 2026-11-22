import { defineConfig } from 'vitest/config'

const BRANCH_THRESHOLD = { branches: 90 }

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['node_modules/**', 'prototypes/**', 'tests/e2e/**', 'tests/lint/fixtures/**'],
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/app/**'],
      reporter: ['text-summary', 'html'],
      thresholds: {
        'src/features/*/domain/**': BRANCH_THRESHOLD,
        'src/shared/lib/**': BRANCH_THRESHOLD,
      },
    },
  },
})
