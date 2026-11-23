import { ESLint, type Linter } from 'eslint'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

// Jede Testdatei erzeugt ihre ESLint-Instanz einmal und lintet alle Fixtures gebündelt in beforeAll
// (#244). Einzelne Aufrufe je Test bauten unter Last das TypeScript-Programm immer wieder auf und
// liefen in Zeitlimits. Die Tests vergleichen danach nur noch fertige Meldungen.

export const fixturePath = (relativePath: string): string =>
  fileURLToPath(new URL(`fixtures/${relativePath}`, import.meta.url))

// ignore: false, weil die Fixtures im normalen Lauf absichtlich ignoriert werden.
export const createFixtureLinter = (): ESLint => new ESLint({ cwd: projectRoot, ignore: false })

// Die Schichtgrenzen hängen nur an Importen, nicht an Typen. Ohne Project Service muss ESLint je
// Text kein TypeScript-Programm prüfen, und nur die Regeln von eslint-plugin-boundaries laufen
// (typbasierte Regeln bräuchten den Project Service).
export const createBoundariesLinter = (): ESLint =>
  new ESLint({
    cwd: projectRoot,
    ignore: false,
    overrideConfig: { languageOptions: { parserOptions: { projectService: false } } },
    ruleFilter: ({ ruleId }) => ruleId.startsWith('boundaries/'),
  })

type LintMessages = Linter.LintMessage[]

/** Lintet alle Fixtures in einem Aufruf, Meldungen je relativem Pfad. */
export async function lintFixtures(
  eslint: ESLint,
  relativePaths: readonly string[],
): Promise<ReadonlyMap<string, LintMessages>> {
  const results = await eslint.lintFiles(relativePaths.map(fixturePath))
  const byPath = new Map(results.map((result) => [result.filePath, result.messages]))
  return new Map(relativePaths.map((path) => [path, byPath.get(fixturePath(path)) ?? []]))
}

export type LintTextInput = Readonly<{ code: string; asFile: string }>

/** Lintet Texte so, als lägen sie an `asFile`, Meldungen in derselben Reihenfolge. */
export async function lintTexts(
  eslint: ESLint,
  inputs: readonly LintTextInput[],
): Promise<LintMessages[]> {
  return Promise.all(
    inputs.map(async ({ code, asFile }) => {
      const [result] = await eslint.lintText(code, { filePath: fixturePath(asFile) })
      return result?.messages ?? []
    }),
  )
}
