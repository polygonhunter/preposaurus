// Umrechnung für Balken und Diagramme: Werte auf eine Skala von 0 bis 100 Prozent.

export function toPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}

export type ChartPoint = Readonly<{ x: number; y: number }>

type ChartBox = Readonly<{ width: number; height: number; padding: number }>

// Ordnet die Werte gleichmäßig über die Breite an. Der kleinste Wert liegt unten, der größte oben.
export function toChartPoints(values: readonly number[], box: ChartBox): ChartPoint[] {
  const min = Math.min(...values)
  const range = Math.max(...values) - min
  const innerHeight = box.height - 2 * box.padding
  const step = values.length > 1 ? (box.width - 2 * box.padding) / (values.length - 1) : 0
  return values.map((value, index) => ({
    x: box.padding + index * step,
    y: box.padding + (range === 0 ? innerHeight / 2 : innerHeight * (1 - (value - min) / range)),
  }))
}

export function toPolylinePoints(points: readonly ChartPoint[]): string {
  return points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}
