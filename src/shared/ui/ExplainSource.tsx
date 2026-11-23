import {
  UNVERIFIED_SOURCE_NOTE,
  type RecommendationSource,
} from '@/shared/config/recommendation-source'
import { ExplainPart } from './ExplainPart'

type ExplainSourceProps = Readonly<{
  source: RecommendationSource
  // Was aus der Quelle stammt, z. B. „Bedarf und Zielmengen“
  subject: string
}>

// Quelle der Werte im Erklär-Blatt mit Stand und Link, ungeprüfte Werte mit dezentem Hinweis
// (#219, #230, M1-09).
export function ExplainSource({ source, subject }: ExplainSourceProps) {
  return (
    <ExplainPart title="Quelle">
      <p className="text-callout">
        {subject} laut {source.name}, Stand {source.asOf}.{' '}
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
