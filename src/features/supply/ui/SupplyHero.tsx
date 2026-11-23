import { DayBar } from '@/shared/ui/DayBar'
import type { OverviewHousehold, OverviewSupply } from '../schemas'
import { formatDays, headline, limitingSentence, scaleFor } from './head-text'
import { SupplyExplainer } from './SupplyExplainer'
import { SupplyExplanation } from './SupplyExplanation'

type SupplyHeroProps = Readonly<{
  supply: OverviewSupply
  goalDays: number | null
  source: OverviewHousehold['source']
}>

const HEADING_ID = 'heute-versorgt'

// „Heute versorgt“ (DESIGN_SYSTEM §7, UX-Konzept §8.1 V1): Satz mit Kernzahl in ganzen Tagen,
// darunter Essen und Wasser auf einer Tages-Skala mit Zielmarke und ein Satz, was begrenzt.
// Ein Tipp auf den Kopf öffnet das Erklär-Blatt mit dem Rechenweg (#219).
export function SupplyHero({ supply, goalDays, source }: SupplyHeroProps) {
  const { prefix, value, unit } = headline(supply)
  const scaleDays = scaleFor([supply.energyDays, supply.waterDays], goalDays)
  const goalProps = goalDays === null ? {} : { goalDays }
  return (
    <section aria-labelledby={HEADING_ID} className="relative px-4 pt-2 breit:px-6">
      <h2 id={HEADING_ID} className="text-body text-fg2">
        Euer Vorrat reicht für
      </h2>
      <p className="mt-1 flex items-baseline gap-2">
        {prefix ? <span className="text-title2">{prefix}</span> : null}
        <span className="text-hero">{value}</span>
        <span className="text-title2">{unit}</span>
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <DayBar
          label="Essen"
          days={supply.energyDays}
          scaleDays={scaleDays}
          isLimiting={supply.bottleneck === 'energy'}
          valueText={formatDays(supply.energyDays)}
          {...goalProps}
        />
        <DayBar
          label="Wasser"
          days={supply.waterDays}
          scaleDays={scaleDays}
          isLimiting={supply.bottleneck === 'water'}
          valueText={formatDays(supply.waterDays)}
          {...goalProps}
        />
      </div>
      <p className="mt-3 text-footnote text-fg2">
        {limitingSentence(supply)}
        {goalDays === null ? null : ` Der Strich markiert euer Ziel: ${formatDays(goalDays)}.`}
      </p>
      <SupplyExplainer>
        <SupplyExplanation supply={supply} source={source} />
      </SupplyExplainer>
    </section>
  )
}
