import { useId } from 'react'
import { Button } from '@/shared/ui/Button'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { Row } from '@/shared/ui/Row'
import { formatQuantity } from '@/shared/lib/quantities'
import type { ProductMatch } from './use-product-matches'

type ProductMatchOfferProps = Readonly<{
  matches: readonly ProductMatch[]
  /** Gewähltes vorhandenes Produkt, auch wenn es inzwischen nicht mehr in `matches` steht */
  chosen: ProductMatch | null
  onChoose: (productId: string | null) => void
}>

const productLabel = (match: ProductMatch) => `${match.name} ${formatQuantity(match.content)}`

function detailsOf(match: ProductMatch): string | undefined {
  const parts = [match.containerName, match.storageLocationName].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

// Wiedererkennen (UX §1, #207): „Zu Nudeln 500 g hinzufügen?“. Genau ein passendes Produkt ist
// vorgewählt und lässt sich mit „Neu anlegen“ abwählen. Gibt es dasselbe Produkt an zwei
// Lagerorten, stehen beide da. Die Vorwahl wird angesagt, weil der Fokus dabei ins MHD-Feld springt.
export function ProductMatchOffer({ matches, chosen, onChoose }: ProductMatchOfferProps) {
  const headerId = useId()
  const announcement = chosen ? `Wird zu ${productLabel(chosen)} hinzugefügt.` : null
  const isEmpty = chosen === null && matches.length === 0
  return (
    <>
      <LiveMessage message={announcement} />
      {isEmpty ? null : (
        <section aria-labelledby={headerId}>
          <GroupHeader id={headerId}>Schon im Vorrat</GroupHeader>
          <Group labelledBy={headerId}>
            {chosen ? (
              <Row
                title={`Wird zu ${productLabel(chosen)} hinzugefügt`}
                subtitle={detailsOf(chosen)}
                trailing={
                  <Button
                    variant="plain"
                    onClick={() => {
                      onChoose(null)
                    }}
                  >
                    Neu anlegen
                  </Button>
                }
              />
            ) : (
              matches.map((match) => (
                <Row
                  key={match.id}
                  title={`Zu ${productLabel(match)} hinzufügen?`}
                  subtitle={detailsOf(match)}
                  trailing={
                    <Button
                      variant="tinted"
                      aria-label={`Zu ${productLabel(match)} hinzufügen`}
                      onClick={() => {
                        onChoose(match.id)
                      }}
                    >
                      Hinzufügen
                    </Button>
                  }
                />
              ))
            )}
          </Group>
        </section>
      )}
    </>
  )
}
