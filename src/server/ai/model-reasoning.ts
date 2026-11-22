// Wie viel ein Modell vor der Antwort denkt. Hängt am Modell, nicht an der Rolle, weil die
// erlaubten Werte je Modell verschieden sind und jede Rolle jedes Modell zugewiesen bekommen kann.
// Doku vom 2026-11-22 (platform.claude.com, Models overview und API errors):
// - Haiku 5.5 denkt standardmäßig adaptiv mit Effort medium und akzeptiert thinking: disabled
//   (bei Effort high oder darunter). Für das Ablesen eines Aufdrucks reicht das Modell ohne
//   Denken: schneller, billiger, und ein Abbruch durch Denk-Tokens ist ausgeschlossen.
// - Sonnet 5.5 lehnt thinking: disabled mit 400 ab und denkt standardmäßig mit Effort high. Es
//   läuft als Zweitversuch bei schwierigen Fotos, deshalb bleibt das adaptive Denken an, aber mit
//   Effort medium statt high: genug für unscharfe Aufdrucke, ohne das Zeitlimit zu reißen.
// - Andere Modelle behalten ihre Standardwerte, statt einen Wert zu riskieren, den sie ablehnen.
export interface ModelReasoning {
  disableThinking: boolean
  effort: 'medium' | null
}

const DEFAULTS: ModelReasoning = { disableThinking: false, effort: null }

const BY_MODEL: Readonly<Record<string, ModelReasoning>> = {
  'claude-haiku-5-5': { disableThinking: true, effort: null },
  'claude-sonnet-5-5': { disableThinking: false, effort: 'medium' },
}

export const reasoningFor = (model: string): ModelReasoning => BY_MODEL[model] ?? DEFAULTS
