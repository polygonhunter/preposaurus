import { unitDatePath } from '@/shared/config/stock-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import type { BestBeforeGroupDto } from '../schemas/detail'
import { DeleteEntryButton } from './DeleteEntryButton'

type DateRowExtrasProps = Readonly<{
  group: BestBeforeGroupDto
  // „Rotkohl (Konserve) · 09/2027“ für die Rückfrage
  label: string
  isAdmin: boolean
  // Wohin es geht, wenn mit der Packung das ganze Produkt verschwindet
  leaveHref: string | null
  onDone: () => void
}>

// Weitere Aktionen im Blatt einer Datumszeile: Datum ändern bzw. nachtragen (#49, #116) und für
// den Admin das endgültige Löschen einer falsch erfassten Packung (#50).
export function DateRowExtras(props: DateRowExtrasProps) {
  const { group, label, isAdmin, leaveHref, onDone } = props
  const unitId = group.units[0]?.id
  if (unitId === undefined) return null
  return (
    <>
      <ButtonLink href={unitDatePath(unitId)} variant="plain">
        {group.kind === 'dated' ? 'Datum ändern' : 'Datum nachtragen'}
      </ButtonLink>
      {isAdmin ? (
        <DeleteEntryButton
          target={{ kind: 'unit', unitId }}
          label="1 Packung löschen …"
          question={`1 Packung ${label} löschen? Sie verschwindet auch aus Verlauf und Statistik.`}
          leaveHref={leaveHref}
          onDone={onDone}
        />
      ) : null}
    </>
  )
}
