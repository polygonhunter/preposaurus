'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Row } from '@/shared/ui/Row'
import { Sheet } from '@/shared/ui/Sheet'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { BestBeforeGroupDto } from '../schemas'
import { useConsume } from './consume-context'
import { groupLabel } from './detail-view'
import { STATE_BADGE, expiryHint, formatPackages } from './stock-format'

type DateGroupRowProps = Readonly<{
  // Name der Lebensmittelart für Blatt und UndoBar
  name: string
  group: BestBeforeGroupDto
  // Aus dieser Zeile nimmt „1 entnehmen“ (frühestes MHD)
  isNext: boolean
}>

// Datumszeile im Detail (UX-Konzept §8.4): „11/2027 · 5×“ mit Zustand. Ein Tipp öffnet das Blatt
// mit „Verbraucht“, so lässt sich statt der vorgeschlagenen auch eine andere Packung nehmen.
export function DateGroupRow({ name, group, isNext }: DateGroupRowProps) {
  const [isOpen, setOpen] = useState(false)
  const { consume, isLocked } = useConsume()
  const label = groupLabel(group)
  const state = group.kind === 'dated' ? group.state : 'no-date'
  const badge = STATE_BADGE[state]
  const first = group.units[0]
  const hint = expiryHint(state, first?.kind ?? 'best-before')
  const close = () => {
    setOpen(false)
  }
  const take = () => {
    if (first !== undefined) consume({ kind: 'unit', unitId: first.id }, { name, dateLabel: label })
    close()
  }
  return (
    <Row
      title={label}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-1.5">
          <StatusBadge tone={badge.tone} label={badge.label} />
          {isNext ? <span>· als Nächstes dran</span> : null}
        </span>
      }
      trailing={`${String(group.units.length)}×`}
      action={{
        onClick: () => {
          setOpen(true)
        },
      }}
      accessory={
        <Sheet
          isOpen={isOpen}
          onClose={close}
          title={`${name} · ${label}`}
          actions={
            <>
              <Button onClick={take} disabled={isLocked || first === undefined}>
                1 Packung verbraucht
              </Button>
              <Button variant="plain" onClick={close}>
                Abbrechen
              </Button>
            </>
          }
        >
          <p>{`${formatPackages(group.units.length)} · ${badge.label}`}</p>
          {hint === null ? null : <p className="pt-2 text-callout text-fg2">{hint}</p>}
        </Sheet>
      }
    />
  )
}
