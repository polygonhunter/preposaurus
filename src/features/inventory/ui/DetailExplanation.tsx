import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { ExplainPart } from '@/shared/ui/ExplainPart'
import { ExplainSource } from '@/shared/ui/ExplainSource'
import type { FoodTypeDetail } from '../schemas/detail'
import {
  SHELF_LIFE_EXPLAIN_TEXT,
  countedText,
  daysCalculation,
  daysMeaningTexts,
  kcalOriginText,
  kcalText,
  notCountedTexts,
} from './detail-explain-text'

type DetailExplanationProps = Readonly<{
  detail: Pick<FoodTypeDetail, 'totals' | 'need' | 'typicalShelfLifeMonths'>
  source: RecommendationSource | null
}>

const paragraphs = (texts: readonly string[]) =>
  texts.map((text) => (
    <p key={text} className="text-callout">
      {text}
    </p>
  ))

// Inhalt des Erklär-Blatts zu den Kennwerten im Detail (#230): Packungen und Menge, kcal mit
// Herkunft, der Beitrag in Tagen samt Bedeutung (#209), Richtwert zur Haltbarkeit und die Quelle.
export function DetailExplanation({ detail, source }: DetailExplanationProps) {
  const { totals, need } = detail
  const origin = kcalOriginText(totals)
  const days = daysCalculation(totals, need)
  return (
    <>
      <ExplainPart title="Packungen und Menge">
        {paragraphs([countedText(totals), ...notCountedTexts(totals)])}
      </ExplainPart>
      <ExplainPart title="kcal">
        {paragraphs(origin === null ? [kcalText(totals)] : [kcalText(totals), origin])}
      </ExplainPart>
      <ExplainPart title="Beitrag in Tagen">
        {days === null ? null : <p className="text-callout tabular-nums">{days}</p>}
        {paragraphs(daysMeaningTexts(totals))}
      </ExplainPart>
      {detail.typicalShelfLifeMonths === null ? null : (
        <ExplainPart title="Richtwert zur Haltbarkeit">
          <p className="text-callout">{SHELF_LIFE_EXPLAIN_TEXT}</p>
        </ExplainPart>
      )}
      {source === null || days === null ? null : (
        <ExplainSource source={source} subject="Tagesbedarf" />
      )}
    </>
  )
}
