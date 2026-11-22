// Grobe Kosten je Aufruf für das Protokoll ki_aufruf (#59: „Tokens und Kosten gehen an den Aufrufer
// zurück“). Nur Grundpreise für Ein- und Ausgabe, ohne Cache und Batch, weil der Adapter beides
// nicht nutzt. Unbekanntes Modell: null statt einer geratenen Zahl.
// Quelle: https://platform.claude.com/docs/en/about-claude/pricing, Stand 2026-11-22.
const USD_PER_MILLION_TOKENS: Readonly<Record<string, { input: number; output: number }>> = {
  // Prompts bis 100.000 Tokens. Ein Foto mit Prompt liegt weit darunter.
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-opus-5-5': { input: 4, output: 20 },
}

const MILLION = 1_000_000

interface TokenUsage {
  inputTokens: number | null
  outputTokens: number | null
}

export function estimateCostUsd(model: string, usage: TokenUsage): number | null {
  const price = USD_PER_MILLION_TOKENS[model]
  if (price === undefined || usage.inputTokens === null || usage.outputTokens === null) return null
  return (usage.inputTokens * price.input + usage.outputTokens * price.output) / MILLION
}
