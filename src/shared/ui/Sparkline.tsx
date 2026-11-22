import { toChartPoints, toPolylinePoints } from '@/shared/lib/scale'

const BOX = { width: 300, height: 64, padding: 4 }

type SparklineProps = Readonly<{
  values: readonly number[]
  // Beschreibung für Screenreader, z. B. „Tage versorgt, von 8 auf 12 gestiegen“
  label: string
  startLabel: string
  endLabel: string
}>

// Verlaufsdiagramm: 1,5-px-Linie, letzte Marke als Punkt, keine Füllung, Achse nur Anfang und Ende.
export function Sparkline({ values, label, startLabel, endLabel }: SparklineProps) {
  const points = toChartPoints(values, BOX)
  const last = points.at(-1)
  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${String(BOX.width)} ${String(BOX.height)}`}
        role="img"
        aria-label={label}
        className="h-auto w-full text-bar"
      >
        <polyline
          points={toPolylinePoints(points)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {last ? <circle cx={last.x} cy={last.y} r={3} fill="currentColor" /> : null}
      </svg>
      <figcaption aria-hidden="true" className="flex justify-between text-caption text-fg2">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </figcaption>
    </figure>
  )
}
