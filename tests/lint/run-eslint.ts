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

type LintTextOptions = Readonly<{ code: string; asFile: string }>

export async function lintTextAs({ code, asFile }: LintTextOptions): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath: fixturePath(asFile) })
  return result?.messages ?? []
}
