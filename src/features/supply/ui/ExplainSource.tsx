import type { OverviewHousehold } from '../schemas'
import { ExplainPart } from './ExplainPart'
import { UNVERIFIED_SOURCE_NOTE } from './source-text'

type ExplainSourceProps = Readonly<{ source: NonNullable<OverviewHousehold['source']> }>

// Quelle der Bedarfswerte mit Stand und Link, ungeprüfte Werte mit dezentem Hinweis (#219, M1-09).
export function ExplainSource({ source }: ExplainSourceProps) {
  return (
    <ExplainPart title="Quelle">
      <p className="text-callout">
        Bedarf und Zielmengen laut {source.name}, Stand {source.asOf}.{' '}
        <a href={source.link} target="_blank" rel="noreferrer" className="text-accent underline">
          Zur Quelle
        </a>
      </p>
      {source.isVerified ? null : (
        <p className="text-footnote text-fg2">{UNVERIFIED_SOURCE_NOTE}</p>
      )}
    </ExplainPart>
  )
}
