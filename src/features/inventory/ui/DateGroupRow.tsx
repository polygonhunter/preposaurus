'use client'

import { useState } from 'react'
import { Row } from '@/shared/ui/Row'
import { Sheet } from '@/shared/ui/Sheet'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { BestBeforeGroupDto } from '../schemas'
import { groupBadge, groupLabel, partlyCheckedNote, stillGoodCandidates } from './detail-view'
import { expiryHint, formatPackages } from './stock-format'
import { UnitSheetActions } from './UnitSheetActions'

type DateGroupRowProps = Readonly<{
  // Name der Lebensmittelart für Blatt und UndoBar
  name: string
  group: BestBeforeGroupDto
  // Aus dieser Zeile nimmt „1 entnehmen“ (frühestes MHD)
  isNext: boolean
}>

const STILL_GOOD_NOTE =
  '„Noch gut“ vermerkt die abgelaufenen Packungen dieser Zeile als geprüft. Sie bleiben im Vorrat.'

// Datumszeile im Detail (UX-Konzept §8.4): „11/2027 · 5×“ mit Zustand. Ein Tipp öffnet das Blatt
// mit Verbraucht, Entsorgt und bei abgelaufenem MHD „Noch gut“ (#47). So lässt sich statt der
// vorgeschlagenen auch eine andere Packung nehmen.
export function DateGroupRow({ name, group, isNext }: DateGroupRowProps) {
  const [isOpen, setOpen] = useState(false)
  const label = groupLabel(group)
  const badge = groupBadge(group)
  const partly = partlyCheckedNote(group)
  const stillGoodIds = stillGoodCandidates(group)
  const first = group.units[0]
  const hint = expiryHint(
    group.kind === 'dated' ? group.state : 'no-date',
    first?.kind ?? 'best-before',
  )
  const close = () => {
    setOpen(false)
  }
  return (
    <Row
      title={label}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-1.5">
          <StatusBadge tone={badge.tone} label={badge.label} />
          {partly === null ? null : <span>· {partly}</span>}
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
            <UnitSheetActions
              unitId={first?.id ?? null}
              stillGoodIds={stillGoodIds}
              name={name}
              dateLabel={label}
              onDone={close}
            />
          }
        >
          <p>{`${formatPackages(group.units.length)} · ${badge.label}`}</p>
          {hint === null ? null : <p className="pt-2 text-callout text-fg2">{hint}</p>}
          {stillGoodIds.length === 0 ? null : (
            <p className="pt-2 text-callout text-fg2">{STILL_GOOD_NOTE}</p>
          )}
        </Sheet>
      }
    />
  )
}
