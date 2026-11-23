// Aufbau des JSON-Exports eines Haushalts (#80, SYS-01). Bewusst nicht enthalten: Passwort-Hashes,
// Sitzungen, technische E-Mail-Adressen, KI-Verbindungen und -Schlüssel (auch nicht verschlüsselt,
// #108), Push-Abos, Entwürfe und Anmeldesperren. Fotos stehen nur als Verweis drin (U11).

/** Steigt, sobald sich der Aufbau unverträglich ändert. */
const EXPORT_FORMAT_VERSION = 1
const EXPORT_FORMAT = 'preposaurus-haushalt'

export type ExportSource = Readonly<{
  key: string
  name: string
  country: string
  asOf: string
  link: string
  defaultDays: number
  isVerified: boolean
}>

export type ExportSettings = Readonly<{
  defaultDiet: string
  ampelYellowDays: number
  ampelOrangeDays: number
  isAiEnabled: boolean
  stillGoodCountsAsSupplied: boolean
  weeklySummaryEnabled: boolean
  weeklySummaryWeekday: number
  weeklySummaryTime: string
  urgentEnabled: boolean
}>

export type ExportHousehold = Readonly<{
  name: string
  calculationMode: string
  settings: ExportSettings | null
  goal: Readonly<{ days: number; targetDate: string | null }> | null
}>

export type ExportMember = Readonly<{
  id: string
  name: string
  type: string
  birthDate: string | null
  sex: string | null
  activityLevel: string | null
  weightKg: number | null
  condition: string | null
  diet: string | null
  allergies: readonly string[]
}>

export type ExportUser = Readonly<{
  id: string
  username: string
  displayName: string
  role: string
  isActive: boolean
  memberId: string | null
}>

export type ExportUnit = Readonly<{
  id: string
  bestBefore: string | null
  bestBeforePrecision: string | null
  bestBeforeKind: string
  isBestBeforeEstimated: boolean
  status: string
  takenAt: string | null
  takenBy: string | null
  checkedAt: string | null
  addedAt: string
}>

export type ExportPhoto = Readonly<{
  id: string
  role: string
  path: string
  mimeType: string
  unitId: string | null
}>

export type ExportProduct = Readonly<{
  id: string
  name: string
  category: string
  foodType: string | null
  container: string | null
  storageLocation: string | null
  content: Readonly<{ amount: number; unit: string }>
  drainedWeightG: number | null
  nutritionPer100: Readonly<{
    kcal: number | null
    protein: number | null
    carbs: number | null
    fat: number | null
  }>
  nutritionSource: string | null
  units: readonly ExportUnit[]
  photos: readonly ExportPhoto[]
}>

export type ExportRestockItem = Readonly<{
  label: string
  amount: number | null
  unit: string | null
  source: string
  /** offen · erledigt · ausgeblendet (#201) */
  status: string
  doneAt: Date | null
  productId: string | null
}>

export type HouseholdExportData = Readonly<{
  household: ExportHousehold
  source: ExportSource | null
  members: readonly ExportMember[]
  users: readonly ExportUser[]
  products: readonly ExportProduct[]
  restock: readonly ExportRestockItem[]
}>

export type ExportMeta = Readonly<{ appVersion: string; license: string; exportedAt: Date }>

export type HouseholdExport = Readonly<{
  format: typeof EXPORT_FORMAT
  formatVersion: typeof EXPORT_FORMAT_VERSION
  appVersion: string
  license: string
  exportedAt: string
  notice: string
}> &
  HouseholdExportData

const NOTICE =
  'Export aus Preposaurus. Ohne Passwörter, Sitzungen und KI-Schlüssel. Fotos nur als Verweis ' +
  '(Pfad im Foto-Ordner bzw. in der Sicherung).'

export function buildHouseholdExport(data: HouseholdExportData, meta: ExportMeta): HouseholdExport {
  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    appVersion: meta.appVersion,
    license: meta.license,
    exportedAt: meta.exportedAt.toISOString(),
    notice: NOTICE,
    ...data,
  }
}

/** „preposaurus-export-2026-11-23.json“, Tag in deutscher Zeit */
export function exportFileName(exportedAt: Date): string {
  const day = exportedAt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  return `preposaurus-export-${day}.json`
}
