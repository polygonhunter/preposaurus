type StatTile = Readonly<{ value: string; label: string }>

type StatTilesProps = Readonly<{ tiles: readonly StatTile[] }>

// 2–4 Kennzahlen nebeneinander in einer Gruppe, durch Linien getrennt.
export function StatTiles({ tiles }: StatTilesProps) {
  return (
    <dl className="mx-4 flex overflow-hidden rounded-group bg-surface breit:mx-6 breit:border breit:border-line">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex min-w-0 flex-1 flex-col-reverse px-3 py-2.5 not-first:border-l not-first:border-line"
        >
          <dt className="truncate text-footnote text-fg2">{tile.label}</dt>
          <dd className="text-title2">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
