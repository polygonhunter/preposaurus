import { ESLint, type Linter } from 'eslint'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

// ignore: false, weil die Fixtures im normalen Lauf absichtlich ignoriert werden.
const eslint = new ESLint({ cwd: projectRoot, ignore: false })

export const fixturePath = (relativePath: string): string =>
  fileURLToPath(new URL(`fixtures/${relativePath}`, import.meta.url))

export async function lintFile(relativePath: string): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintFiles([fixturePath(relativePath)])
  return result?.messages ?? []
}

// Der erste Lauf baut das TypeScript-Programm auf und dauert unter Last (CI, viele parallele
// Testdateien) länger als ein einzelner Test darf. Darum einmal vorab in beforeAll, das das
// großzügigere hookTimeout hat.
export async function warmUpEslint(): Promise<void> {
  await lintFile('limits/clean.ts')
}

type LintTextOptions = Readonly<{ code: string; asFile: string }>

export async function lintTextAs({ code, asFile }: LintTextOptions): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath: fixturePath(asFile) })
  return result?.messages ?? []
}
