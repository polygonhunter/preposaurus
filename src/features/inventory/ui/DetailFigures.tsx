import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { ExplainSheet } from '@/shared/ui/ExplainSheet'
import { StatTiles } from '@/shared/ui/StatTiles'
import type { FoodTypeDetail } from '../schemas'
import { DetailExplanation } from './DetailExplanation'
import { detailTiles, uncountedNote } from './stock-format'

type DetailFiguresProps = Readonly<{
  detail: Pick<FoodTypeDetail, 'totals' | 'need' | 'typicalShelfLifeMonths'>
  source: RecommendationSource | null
}>

const EXPLAIN_TITLE = 'So wird gerechnet'

// Wie auf der Übersicht (#219): Der Knopf steht sichtbar unter den Kacheln, seine Fläche (::after)
// deckt Kacheln und Hinweis ab. Ein Tipp auf eine Kachel öffnet also das Blatt (#230).
const EXPLAIN_TRIGGER = {
  label: EXPLAIN_TITLE,
  className:
    'mx-8 inline-flex min-h-11 items-center text-footnote text-accent after:absolute after:inset-0 after:rounded-group breit:mx-10',
}

// Kennwerte im Detail (UX-Konzept §8.4): Kacheln, darunter was nicht mitzählt, und der Rechenweg.
export function DetailFigures({ detail, source }: DetailFiguresProps) {
  const uncounted = uncountedNote(detail.totals)
  return (
    <div className="relative pt-3">
      <StatTiles tiles={detailTiles(detail)} />
      {uncounted === null ? null : (
        <p className="px-8 pt-1.5 text-footnote text-fg2 breit:px-10">{uncounted}</p>
      )}
      <ExplainSheet title={EXPLAIN_TITLE} trigger={EXPLAIN_TRIGGER}>
        <DetailExplanation detail={detail} source={source} />
      </ExplainSheet>
    </div>
  )
}
