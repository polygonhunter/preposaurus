import { cx } from '@/shared/lib/class-names'

type StatTile = Readonly<{ value: string; label: string }>

type StatTilesProps = Readonly<{ tiles: readonly StatTile[] }>

// Vier Kacheln passen auf 375 px nicht ohne Silbentrennung („abgelaufen“, „ca. 5.385“): kompakt
// 2 × 2, ab „mittel“ in einer Reihe. Bis zu drei Kacheln stehen immer nebeneinander.
const FOUR_TILES = 4

// 2–4 Kennzahlen in einer Gruppe, durch Linien getrennt (die Lücke zeigt die Linienfarbe darunter).
export function StatTiles({ tiles }: StatTilesProps) {
  return (
    <dl
      className={cx(
        'mx-4 grid gap-px overflow-hidden rounded-group bg-line breit:mx-6 breit:border breit:border-line',
        tiles.length === FOUR_TILES
          ? 'grid-cols-2 mittel:grid-cols-4'
          : 'auto-cols-fr grid-flow-col',
      )}
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="flex min-w-0 flex-col-reverse bg-surface px-3 py-2.5">
          <dt className="truncate text-footnote text-fg2">{tile.label}</dt>
          <dd className="text-title2 whitespace-nowrap">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
