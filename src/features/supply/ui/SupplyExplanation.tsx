import type { OverviewHousehold, OverviewSupply } from '../schemas'
import {
  approximateText,
  caveatTexts,
  energyCalculation,
  needLineText,
  needTotalText,
  resultText,
  waterCalculation,
} from './explain-text'
import { ExplainPart } from './ExplainPart'
import { ExplainSource } from './ExplainSource'

type SupplyExplanationProps = Readonly<{
  supply: OverviewSupply
  source: OverviewHousehold['source']
}>

// Inhalt des Erklär-Blatts (#219): Bedarf, Rechnung für Essen und Wasser, Ergebnis, „ca.“, was
// nicht mitzählt und die Quelle. Die Fachwörter stehen hier mit Erklärung (UX-Konzept §11).
export function SupplyExplanation({ supply, source }: SupplyExplanationProps) {
  const { explanation } = supply
  return (
    <div className="flex flex-col gap-5 pb-1">
      <ExplainPart title="Bedarf am Tag">
        <ul className="text-callout">
          {explanation.needLines.map((line) => (
            <li key={line.type}>{needLineText(line)}</li>
          ))}
        </ul>
        <p className="text-callout">{needTotalText(explanation)}</p>
      </ExplainPart>
      <ExplainPart title="Essen">
        <p className="text-callout tabular-nums">{energyCalculation(supply)}</p>
      </ExplainPart>
      <ExplainPart title="Wasser">
        <p className="text-callout tabular-nums">{waterCalculation(supply)}</p>
        <p className="text-footnote text-fg2">Andere Getränke zählen nicht als Wasser.</p>
      </ExplainPart>
      <ExplainPart title="Ergebnis">
        <p className="text-callout">{resultText(supply)}</p>
      </ExplainPart>
      <ExplainPart title="Was „ca.“ bedeutet">
        <p className="text-callout">{approximateText(explanation)}</p>
      </ExplainPart>
      <ExplainPart title="Was nicht mitzählt">
        <ul className="flex flex-col gap-1 text-callout">
          {caveatTexts(explanation).map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </ExplainPart>
      {source === null ? null : <ExplainSource source={source} />}
    </div>
  )
}
