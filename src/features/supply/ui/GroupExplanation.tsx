import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { ExplainPart } from '@/shared/ui/ExplainPart'
import { ExplainSource } from '@/shared/ui/ExplainSource'
import type { OverviewGroup } from '../schemas'
import {
  GROUP_COUNTING_TEXT,
  GROUP_MEANING_TEXTS,
  groupCalculation,
  groupResultText,
  groupTargetText,
} from './group-explain-text'

type GroupExplanationProps = Readonly<{
  group: OverviewGroup
  source: RecommendationSource | null
}>

// Inhalt des Erklär-Blatts einer Warengruppe (#230): Rechnung, Zielmenge, Ergebnis, was die Zahl
// bedeutet (#209), was zählt und die Quelle.
export function GroupExplanation({ group, source }: GroupExplanationProps) {
  return (
    <>
      <ExplainPart title="Rechnung">
        <p className="text-callout tabular-nums">{groupCalculation(group)}</p>
        <p className="text-callout">{groupResultText(group)}</p>
      </ExplainPart>
      <ExplainPart title="Zielmenge">
        <p className="text-callout">{groupTargetText(group)}</p>
      </ExplainPart>
      <ExplainPart title="Was diese Zahl bedeutet">
        {GROUP_MEANING_TEXTS.map((text) => (
          <p key={text} className="text-callout">
            {text}
          </p>
        ))}
      </ExplainPart>
      <ExplainPart title="Was zählt">
        <p className="text-callout">{GROUP_COUNTING_TEXT}</p>
      </ExplainPart>
      {source === null ? null : <ExplainSource source={source} subject="Zielmengen" />}
    </>
  )
}
