// Parameter des Messskripts. Modelle als Kurzname (haiku, sonnet, opus) oder volle Modell-ID.
import { parseArgs } from 'node:util'
import { AI_MODEL_CHOICES } from '../../src/shared/config/ai-roles'
import { PHOTO_ROLES, type PhotoRole } from '../../src/shared/config/constants'
import { err, ok, type Result } from '../../src/shared/lib/result'

export interface PocOptions {
  /** Ordner mit fotos/, erwartungen.json und berichte/ */
  folder: string
  modelsByRole: Record<PhotoRole, string[]>
  /** null: alle Rollen aus den Erwartungswerten */
  roles: PhotoRole[] | null
  withStandard: boolean
  showHelp: boolean
}

const DEFAULT_MODELS = 'haiku,sonnet'

export const USAGE = `Aufruf: npm run poc:recognition -- [Optionen]

  --ordner <pfad>              Ordner mit fotos/ und erwartungen.json (Standard: poc)
  --modelle <liste>            Modelle für alle Rollen (Standard: ${DEFAULT_MODELS})
  --modelle-verpackung <liste> nur für die Verpackung, ebenso
  --modelle-naehrwerte <liste> und --modelle-mhd <liste>
  --rollen <liste>             nur diese Rollen (verpackung, naehrwerte, mhd)
  --ohne-standard              MHD ohne die Standard-Strategie mit Zweitversuch
  --hilfe                      diese Hilfe

Modelle: haiku, sonnet, opus oder eine volle ID wie claude-haiku-5-5.
Trockenlauf ohne Kosten: AI_PROVIDER=fake npm run poc:recognition`

const OPTIONS = {
  ordner: { type: 'string', default: 'poc' },
  modelle: { type: 'string', default: DEFAULT_MODELS },
  'modelle-verpackung': { type: 'string' },
  'modelle-naehrwerte': { type: 'string' },
  'modelle-mhd': { type: 'string' },
  rollen: { type: 'string' },
  'ohne-standard': { type: 'boolean', default: false },
  hilfe: { type: 'boolean', default: false },
} as const

const splitList = (text: string) =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

function resolveModel(name: string): string | null {
  const byAlias = AI_MODEL_CHOICES.find((model) => model.split('-')[1] === name.toLowerCase())
  if (byAlias !== undefined) return byAlias
  return /^claude-[a-z0-9-]+$/.test(name) ? name : null
}

function parseModels(text: string): Result<string[], string> {
  const names = splitList(text)
  const models = names.map(resolveModel)
  const unknown = names.filter((_, index) => models[index] === null)
  if (names.length === 0) return err('Keine Modelle angegeben.')
  if (unknown.length > 0) return err(`Unbekanntes Modell: ${unknown.join(', ')}`)
  return ok([...new Set(models.filter((model) => model !== null))])
}

const isPhotoRole = (role: string): role is PhotoRole =>
  (PHOTO_ROLES as readonly string[]).includes(role)

function parseRoles(text: string | undefined): Result<PhotoRole[] | null, string> {
  if (text === undefined) return ok(null)
  const names = splitList(text)
  const unknown = names.filter((name) => !isPhotoRole(name))
  if (unknown.length > 0) return err(`Unbekannte Rolle: ${unknown.join(', ')}`)
  return ok(names.filter(isPhotoRole))
}

type Values = ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>['values']

function parseModelsByRole(values: Values): Result<Record<PhotoRole, string[]>, string> {
  const modelsByRole: Partial<Record<PhotoRole, string[]>> = {}
  for (const role of PHOTO_ROLES) {
    const parsed = parseModels(values[`modelle-${role}`] ?? values.modelle)
    if (!parsed.ok) return parsed
    modelsByRole[role] = parsed.value
  }
  return ok(modelsByRole as Record<PhotoRole, string[]>)
}

export function parsePocArgs(args: readonly string[]): Result<PocOptions, string> {
  let values: Values
  try {
    values = parseArgs({ args: [...args], options: OPTIONS, strict: true }).values
  } catch (error) {
    return err(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`)
  }
  const modelsByRole = parseModelsByRole(values)
  if (!modelsByRole.ok) return modelsByRole
  const roles = parseRoles(values.rollen)
  if (!roles.ok) return roles
  return ok({
    folder: values.ordner,
    modelsByRole: modelsByRole.value,
    roles: roles.value,
    withStandard: !values['ohne-standard'],
    showHelp: values.hilfe,
  })
}
