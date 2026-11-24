import { useEffect, useRef } from 'react'
import { Button } from '@/shared/ui/Button'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Icon } from '@/shared/ui/Icon'
import type { SupplyChange } from '../domain/supply-change'
import { supplyChangeText } from './saved-text'

type CaptureSavedProps = Readonly<{
  saved: Readonly<{ unitCount: number; supplyChange: SupplyChange | null }>
  productName: string
  /** Erste Erfassung in einen leeren Vorrat (#54, erster Start) */
  isFirst: boolean
  /** „Noch eins“ lädt die Optionen neu, bis dahin bleibt die Bestätigung stehen */
  isReloading: boolean
  onAnother: () => void
}>

const packages = (count: number) => (count === 1 ? '1 Packung' : `${String(count)} Packungen`)

// Bestätigung nach dem Speichern (#54) mit den beiden Wegen „Noch eins“ und „Zum Vorrat“. Der Fokus
// springt auf die Meldung, damit auch ein Screenreader das Ergebnis ansagt. „Hinzugefügt“ statt
// „sind jetzt im Vorrat“, weil beim Nachschub schon mehr Packungen da sind (#207). Ändern sich die
// ganzen Tage von Essen oder Wasser, sagt ein zweiter Satz, wie lange es jetzt reicht (#231).
export function CaptureSaved({
  saved,
  productName,
  isFirst,
  isReloading,
  onAnother,
}: CaptureSavedProps) {
  const { unitCount, supplyChange } = saved
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="mx-4 flex flex-col gap-6 pt-8 breit:mx-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Icon name="check" size={40} className="text-green" />
        <h2 ref={headingRef} tabIndex={-1} className="text-title2 outline-none">
          Gespeichert
        </h2>
        <p className="max-w-sm text-body text-fg2">
          {packages(unitCount)} {productName} hinzugefügt.
          {isFirst ? ' Der Anfang ist gemacht.' : ''}
        </p>
        {supplyChange === null ? null : (
          <p className="max-w-sm text-body">{supplyChangeText(supplyChange)}</p>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onAnother} pendingLabel={isReloading ? 'Lädt …' : undefined}>
          Noch eins erfassen
        </Button>
        <ButtonLink href="/vorrat" variant="tinted">
          Zum Vorrat
        </ButtonLink>
      </div>
    </section>
  )
}
