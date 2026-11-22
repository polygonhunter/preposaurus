// Conventional Commits nach CODE_PRINZIPIEN §11. Beschreibung deutsch, darum keine Groß-/Kleinschreib-Regel.
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'build', 'ci', 'perf'],
    ],
    'header-max-length': [2, 'always', 72],
    'subject-case': [0],
  },
}

export default config
