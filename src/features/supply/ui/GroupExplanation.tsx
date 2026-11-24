import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { DAYS_TERM } from '@/shared/lib/supply-terms'
import { ExplainPart } from '@/shared/ui/ExplainPart'
import { ExplainSource } from '@/shared/ui/ExplainSource'
import type { OverviewGroup } from '../schemas'
import {
  GROUP_COUNTING_TEXT,
  GROUP_MEANING_TEXTS,
  groupCalculation,
  groupResultText,
  groupTargetText,
  satietyCalculation,
  satietyResultText,
} from './group-explain-text'

type GroupExplanationProps = Readonly<{
  group: OverviewGroup
  source: RecommendationSource | null
}>

// Inhalt des Erklär-Blatts einer Warengruppe (#230): beide Tage-Zahlen mit Rechnung (#209), die
// Zielmenge, was die Zahlen bedeuten, was zählt und die Quelle.
export function GroupExplanation({ group, source }: GroupExplanationProps) {
  const satiety = satietyCalculation(group)
  return (
    <>
      <ExplainPart title={DAYS_TERM.amount}>
        <p className="text-callout tabular-nums">{groupCalculation(group)}</p>
        <p className="text-callout">{groupResultText(group)}</p>
      </ExplainPart>
      <ExplainPart title="Zielmenge">
        <p className="text-callout">{groupTargetText(group)}</p>
      </ExplainPart>
      <ExplainPart title={DAYS_TERM.food}>
        {satiety === null ? null : <p className="text-callout tabular-nums">{satiety}</p>}
        <p className="text-callout">{satietyResultText(group)}</p>
      </ExplainPart>
      <ExplainPart title="Was die Zahlen bedeuten">
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
