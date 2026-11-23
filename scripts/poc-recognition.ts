// PoC Foto-Erkennung (M14-01, #103): misst die echte Erkennung je Foto-Rolle und Modell gegen
// Erwartungswerte und schreibt einen Bericht. Anleitung: docs/POC_ERKENNUNG.md.
//   npm run poc:recognition -- --modelle haiku,sonnet
// Fotos, Erwartungen und Berichte liegen in poc/ (git-ignoriert, Fotos können Standortdaten tragen).
import { parsePocArgs, USAGE } from './poc-recognition/cli-options'
import { measureRecognition } from './poc-recognition/measure'

const print = (text: string) => process.stdout.write(`${text}\n`)

async function main(args: readonly string[]): Promise<void> {
  const options = parsePocArgs(args)
  if (options.ok && options.value.showHelp) {
    print(USAGE)
    return
  }
  const result = options.ok ? await measureRecognition(options.value, { print }) : options
  if (result.ok) {
    print(result.value)
    return
  }
  process.stderr.write(`${result.error}\n`)
  process.exitCode = 1
}

await main(process.argv.slice(2))
