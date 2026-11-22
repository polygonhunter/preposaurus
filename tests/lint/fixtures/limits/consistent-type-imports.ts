// verbatimModuleSyntax lehnt Wert-Importe für Typen schon in tsc ab, ESLint fängt zusätzlich import()-Typen.
export type Node = import('react').ReactNode
