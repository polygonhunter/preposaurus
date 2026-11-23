import Link from 'next/link'
import { cx } from '@/shared/lib/class-names'
import { FOLD_LEFT_MAX_WIDTH } from '@/shared/ui/split-columns'

type CaptureModeSwitchProps = Readonly<{ current: 'foto' | 'manuell' }>

const MODES = [
  { key: 'foto', label: 'Foto', href: '/neu/foto' },
  { key: 'manuell', label: 'Manuell', href: '/neu/manuell' },
] as const

// Umschalter Foto · Manuell (UX §8.5), immer sichtbar. Optik wie die Segment-Steuerung, aber als
// Links, weil jeder Weg eine eigene Adresse hat. Ein offener Foto-Entwurf bleibt dabei erhalten.
// Ab „breit“ höchstens 20 rem und vor der Fenstermitte zu Ende (Falz beim Duo quer).
export function CaptureModeSwitch({ current }: CaptureModeSwitchProps) {
  return (
    <nav aria-label="Weg der Erfassung" className={cx('mx-4 pt-3 breit:mx-6', FOLD_LEFT_MAX_WIDTH)}>
      <ul className="flex rounded-segment bg-fill p-0.5 breit:max-w-xs">
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
