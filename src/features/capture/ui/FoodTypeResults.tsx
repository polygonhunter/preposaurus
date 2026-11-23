import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { foodTypePath, type FoodTypeChoice } from '../domain/capture-options'

type FoodTypeResultsProps = Readonly<{
  /** null: Es wird nicht gesucht, dann stehen die zuletzt genutzten Arten da */
  hits: readonly FoodTypeChoice[] | null
  recent: readonly FoodTypeChoice[]
  onChoose: (foodTypeId: string) => void
}>

/** So viele Treffer stehen zuerst da, der Rest auf „Alle … zeigen“ (#212). */
const FIRST_HITS = 8

// Unter dem Suchfeld: ohne Suche „Zuletzt genutzt“, mit Suche die Treffer samt Pfad. Eine neue
// Suche beginnt wieder mit den ersten Treffern (key am Aufrufer).
export function FoodTypeResults({ hits, recent, onChoose }: FoodTypeResultsProps) {
  const [isAllShown, setAllShown] = useState(false)
  if (hits === null) {
    if (recent.length === 0) return null
    return (
      <>
        <p className="px-8 pt-2 text-footnote text-fg2 breit:px-10">Zuletzt genutzt</p>
        <ChipRow label="Zuletzt genutzt">
          {recent.map((foodType) => (
            <Chip
              key={foodType.id}
              onClick={() => {
                onChoose(foodType.id)
              }}
            >
              {foodType.name}
            </Chip>
          ))}
        </ChipRow>
      </>
    )
  }
  if (hits.length === 0) {
    return (
      <p className="px-8 text-footnote text-fg2 breit:px-10">
        Keine Lebensmittelart gefunden. Versucht es mit einem allgemeineren Wort, z. B. „Gemüse“
        statt einer Sorte.
      </p>
    )
  }
  const shown = isAllShown ? hits : hits.slice(0, FIRST_HITS)
  return (
    <div className="flex flex-col gap-1.5 pt-1.5">
      <Group>
        {shown.map((foodType) => (
          <Row
            key={foodType.id}
            title={foodType.name}
            subtitle={foodTypePath(foodType)}
            action={{
              onClick: () => {
                onChoose(foodType.id)
              },
            }}
          />
        ))}
      </Group>
      {shown.length < hits.length ? (
        <span className="px-4 breit:px-6">
          <Button
            variant="plain"
            onClick={() => {
              setAllShown(true)
            }}
          >
            Alle {hits.length} Treffer zeigen
          </Button>
        </span>
      ) : null}
    </div>
  )
}
