import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeEntry } from '../domain/category'

const formatKcal = (kcal: number | null) =>
  kcal === null ? 'kein Richtwert' : `${kcal.toLocaleString('de-DE')} kcal je 100 g`

// Angaben einer Art aus der Startliste (#126), nur lesend.
export function SystemFoodTypeFacts({ foodType }: Readonly<{ foodType: FoodTypeEntry }>) {
  return (
    <>
      <GroupHeader id="art-angaben">Aus der Startliste</GroupHeader>
      <Group labelledBy="art-angaben">
        <Row title="Kategorie" trailing={foodType.categoryName} />
        <Row title="Richtwert" trailing={formatKcal(foodType.kcalPer100)} />
      </Group>
      <GroupFooter>Arten der Startliste lassen sich nur ausblenden.</GroupFooter>
    </>
  )
}
