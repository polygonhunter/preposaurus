import { ACCOUNT_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { NavRow } from '@/shared/ui/NavRow'
import { Row } from '@/shared/ui/Row'
import type { ReminderDelivery } from '../domain/reminder-settings'
import { describeDelivery, formatMailDelivery } from './reminder-format'

type ReminderDeliveryGroupProps = Readonly<{ delivery: ReminderDelivery }>

// Wie Erinnerungen ankommen (#89). Push je Gerät kommt mit #86, bis dahin steht hier nur ein
// ruhiger Satz statt eines Schalters, der nichts bewirkt. Adresse und Check-in-Mail stellt jeder
// unter Mein Konto für sich ein.
export function ReminderDeliveryGroup({ delivery }: ReminderDeliveryGroupProps) {
  return (
    <>
      <GroupHeader id="zustellung">So kommen sie an</GroupHeader>
      <Group labelledBy="zustellung">
        <Row title="Push" trailing="kommt später" />
        <Row title="Mail" trailing={formatMailDelivery(delivery)} />
        <NavRow title="Eigene Adresse und Check-in-Mail" href={ACCOUNT_PATH} />
      </Group>
      <GroupFooter>{describeDelivery(delivery)}</GroupFooter>
    </>
  )
}
