import { useId } from 'react'
import { Button } from '@/shared/ui/Button'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import { formatQuantity } from '@/shared/lib/quantities'
import type { ProductMatch } from './use-product-matches'

type ProductMatchOfferProps = Readonly<{
  matches: readonly ProductMatch[]
  chosenId: string | null
  onChoose: (productId: string | null) => void
}>

const productLabel = (match: ProductMatch) => `${match.name} ${formatQuantity(match.content)}`

function detailsOf(match: ProductMatch): string | undefined {
  const parts = [match.containerName, match.storageLocationName].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

// Wiedererkennen (UX §1): „Zu Nudeln 500 g hinzufügen?“. Es bleibt ein Angebot, ohne Wahl entsteht
// ein neues Produkt. Gibt es dasselbe Produkt an zwei Lagerorten, stehen beide da.
export function ProductMatchOffer({ matches, chosenId, onChoose }: ProductMatchOfferProps) {
  const headerId = useId()
  const chosen = matches.find((match) => match.id === chosenId)
  if (matches.length === 0) return null
  return (
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
  )
}
