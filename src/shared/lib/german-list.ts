// Namen deutsch aufzählen, für Erinnerungen und Mails (#169): „Reis, Mehl und Linsen“.

function joinWithAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} und ${parts.at(-1) ?? ''}`
}

/**
 * „A, B und C“. Bei mehr als `maxNamed` Namen „A, B, C und 2 weitere“. Jeder Name kommt nur
 * einmal vor, die Reihenfolge bleibt.
 */
export function listNames(names: readonly string[], maxNamed: number): string {
  const unique = [...new Set(names)]
  if (unique.length <= maxNamed) return joinWithAnd(unique)
  const rest = unique.length - maxNamed
  return joinWithAnd([...unique.slice(0, maxNamed), `${String(rest)} weitere`])
}
