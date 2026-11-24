import type { NamedDays as NamedDaysText } from '@/shared/lib/supply-terms'

type NamedDaysProps = Readonly<{ days: NamedDaysText }>

// Tage-Zahl rechts in einer Zeile: der Name klein darüber, damit die Zahl schmal bleibt (#209).
// Das Leerzeichen dazwischen hält Name und Zahl im zugänglichen Namen der Zeile auseinander
// („Menge reicht 6,6 von 10 Tagen“).
export function NamedDays({ days }: NamedDaysProps) {
  return (
    <span className="flex flex-col items-end">
      <span className="text-footnote">{days.label}</span>{' '}
      <span className="tabular-nums">{days.value}</span>
    </span>
  )
}
