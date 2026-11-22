// Structured Outputs garantieren die Schreibweise von Enum-Werten nicht, die Doku rät, sie ohne
// Rücksicht auf Groß- und Kleinschreibung zu vergleichen. Ein „Niedrig“ wäre sonst ein
// Schema-Verstoß und löste beim MHD einen teuren Zweitversuch aus. Ersetzt wird nur ein Wert,
// der sich genau einem Enum-Wert des Schemas zuordnen lässt. Freitext (bezeichnung, roh_text)
// bleibt unberührt, weil das Schema dort kein Enum hat.
type JsonSchemaNode = Readonly<Record<string, unknown>>

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asList = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : [])

function enumValues(node: JsonSchemaNode): string[] {
  const own = asList(node['enum'])
  const variants = asList(node['anyOf']).filter(isRecord)
  return [...own, ...variants.flatMap(enumValues)].filter((value) => typeof value === 'string')
}

function objectNode(node: JsonSchemaNode): JsonSchemaNode | null {
  if (isRecord(node['properties'])) return node
  const variants = asList(node['anyOf']).filter(isRecord)
  return variants.find((variant) => isRecord(variant['properties'])) ?? null
}

function canonicalString(node: JsonSchemaNode, value: string): string {
  const matches = enumValues(node).filter((option) => option.toLowerCase() === value.toLowerCase())
  return matches.length === 1 && matches[0] !== undefined ? matches[0] : value
}

export function canonicalizeEnums(schema: JsonSchemaNode, raw: unknown): unknown {
  if (typeof raw === 'string') return canonicalString(schema, raw)
  const node = objectNode(schema)
  if (node === null || !isRecord(raw) || !isRecord(node['properties'])) return raw
  const properties = node['properties']
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      const child = properties[key]
      return [key, isRecord(child) ? canonicalizeEnums(child, value) : value]
    }),
  )
}
