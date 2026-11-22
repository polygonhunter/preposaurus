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

// Unter dem Suchfeld: ohne Suche „Zuletzt genutzt“, mit Suche die Treffer samt Pfad.
export function FoodTypeResults({ hits, recent, onChoose }: FoodTypeResultsProps) {
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
        Keine Lebensmittelart gefunden. Versucht es mit einem allgemeineren Wort, z. B. „Nudeln“
        statt „Spaghetti“.
      </p>
    )
  }
  return (
    <div className="pt-1.5">
      <Group>
        {hits.map((foodType) => (
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
    </div>
  )
}
