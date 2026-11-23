import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'

type CaptureModeSwitchProps = Readonly<{ current: 'foto' | 'manuell' }>

const MODES = [
  { key: 'foto', label: 'Foto', href: '/neu/foto' },
  { key: 'manuell', label: 'Manuell', href: '/neu/manuell' },
] as const

// Umschalter Foto · Manuell (UX §8.5), immer sichtbar. Optik wie die Segment-Steuerung, aber als
// Links, weil jeder Weg eine eigene Adresse hat. Ein offener Foto-Entwurf bleibt dabei erhalten.
export function CaptureModeSwitch({ current }: CaptureModeSwitchProps) {
  return (
    <nav aria-label="Weg der Erfassung" className="mx-4 pt-3 breit:mx-6 breit:max-w-xs">
      <ul className="flex rounded-segment bg-fill p-0.5">
        {MODES.map((mode) => {
          const isCurrent = mode.key === current
          return (
            <li key={mode.key} className="flex flex-1">
              <Link
                href={mode.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cx(
                  'flex min-h-10 flex-1 items-center justify-center rounded-thumb px-2 text-footnote font-medium transition-colors duration-150 ease-out',
                  isCurrent && 'bg-surface font-semibold shadow-thumb',
                )}
              >
                {mode.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
