import { cx } from '@/shared/lib/class-names'
import { CAPTURE_STEPS, type CaptureStep } from './photo-capture-state'

type StepBarProps = Readonly<{ step: CaptureStep }>

const LABELS: Record<CaptureStep, string> = {
  verpackung: 'Verpackung',
  naehrwerte: 'Nährwerte',
  mhd: 'MHD',
}

// Schrittbalken oben in der Kamera (DESIGN_SYSTEM §7): erledigte und aktueller Schritt hell.
export function StepBar({ step }: StepBarProps) {
  const current = CAPTURE_STEPS.indexOf(step)
  return (
    <ol aria-label="Schritte" className="flex flex-1 gap-1.5">
      {CAPTURE_STEPS.map((item, index) => (
        <li
          key={item}
          aria-current={index === current ? 'step' : undefined}
          className="flex flex-1 flex-col gap-1"
        >
          <span
            aria-hidden="true"
            className={cx('h-1 rounded-full', index <= current ? 'bg-fg' : 'bg-fill')}
          />
          <span className={cx('text-caption', index === current ? 'text-fg' : 'text-fg2')}>
            {LABELS[item]}
          </span>
        </li>
      ))}
    </ol>
  )
}
