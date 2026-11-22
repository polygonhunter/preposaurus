import { cx } from '@/shared/lib/class-names'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Icon } from '@/shared/ui/Icon'
import { ICON_PATHS, type IconName } from '@/shared/ui/icon-paths'

// Klassen ausgeschrieben, damit Tailwind sie im Quelltext findet.
const TYPE_SCALE = [
  ['text-hero', '12'],
  ['text-title', 'Large Title'],
  ['text-title2', 'Kennzahl 9,6'],
  ['text-headline', 'Betonte Zeile'],
  ['text-body', 'Zeilentitel und Fließtext'],
  ['text-callout', 'Zweitzeile mit Gewicht'],
  ['text-footnote', 'Untertitel, Gruppenkopf'],
  ['text-caption', 'Achse, Beschriftung'],
] as const

const SWATCHES = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['fill', 'bg-fill'],
  ['fg', 'bg-fg'],
  ['fg2', 'bg-fg2'],
  ['line', 'bg-line'],
  ['bar', 'bg-bar'],
  ['accent', 'bg-accent'],
  ['red', 'bg-red'],
  ['orange', 'bg-orange'],
  ['yellow', 'bg-yellow'],
  ['green', 'bg-green'],
  ['bar-warn', 'bg-bar-warn'],
] as const

const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[]

export function BasicsSection() {
  return (
    <>
      <GroupHeader>Schrift</GroupHeader>
      <div className="mx-4 flex flex-col gap-2 rounded-group bg-surface p-4">
        {TYPE_SCALE.map(([className, sample]) => (
          <p key={className} className={className}>
            {sample}
          </p>
        ))}
      </div>
      <GroupHeader>Farben</GroupHeader>
      <ul className="mx-4 grid grid-cols-4 gap-3 rounded-group bg-surface p-4 text-caption">
        {SWATCHES.map(([name, className]) => (
          <li key={name} className="flex flex-col items-center gap-1">
            <span className={cx('size-10 rounded-full border border-line', className)} />
            {name}
          </li>
        ))}
      </ul>
      <GroupHeader>Piktogramme</GroupHeader>
      <ul className="mx-4 grid grid-cols-6 gap-3 rounded-group bg-surface p-4 text-fg2">
        {ICON_NAMES.map((name) => (
          <li key={name} className="grid place-items-center" title={name}>
            <Icon name={name} label={name} />
          </li>
        ))}
      </ul>
    </>
  )
}
