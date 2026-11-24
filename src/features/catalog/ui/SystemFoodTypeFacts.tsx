import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { FoodTypeEntry } from '../domain/category'
import { referenceFacts } from './catalog-labels'

// Angaben einer Art aus der Startliste (#126), nur lesend. Die Richtwerte gelten je 100 g bzw. ml,
// dieselben Felder haben eigene Arten (#243).
export function SystemFoodTypeFacts({ foodType }: Readonly<{ foodType: FoodTypeEntry }>) {
  return (
    <>
      <GroupHeader id="art-angaben">Aus der Startliste</GroupHeader>
      <Group labelledBy="art-angaben">
        <Row title="Kategorie" trailing={foodType.categoryName} />
      </Group>
      <GroupHeader id="art-richtwerte">Richtwerte je 100 g oder ml</GroupHeader>
      <Group labelledBy="art-richtwerte">
        {referenceFacts(foodType).map(({ title, value }) => (
          <Row key={title} title={title} trailing={value} />
        ))}
      </Group>
      <GroupFooter>Arten der Startliste lassen sich nur ausblenden.</GroupFooter>
    </>
  )
}
