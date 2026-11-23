'use client'
import { useActionState } from 'react'
import type { AmpelThresholds } from '@/features/inventory/domain/unit-state'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { saveAmpelAction, type AmpelFormState } from '../actions/save-ampel-action'

type AmpelFormProps = Readonly<{
  thresholds: AmpelThresholds
  // id des Gruppenkopfs: Das Formular heißt so, die Seite hat mehrere „Speichern“
  labelledBy: string
}>

const INITIAL_STATE: AmpelFormState = { status: 'idle', message: null, errors: {}, values: null }

// Ampel-Schwellen (EIN-05, #78): ab wie vielen Tagen vor dem MHD eine Packung gelb (bald fällig)
// und orange (dringend) wird. Standard 90 und 28 Tage.
export function AmpelForm({ thresholds, labelledBy }: AmpelFormProps) {
  const [state, formAction, isPending] = useActionState(saveAmpelAction, INITIAL_STATE)
  const formRef = useFocusFirstInvalid(state)
  const values = state.values ?? {
    soonDays: String(thresholds.soonDays),
    urgentDays: String(thresholds.urgentDays),
  }
  const { errors } = state
  return (
    <form
      ref={formRef}
      action={formAction}
      aria-labelledby={labelledBy}
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <Field
        label="Gelb, bald fällig: Tage vor dem MHD"
        name="gelb"
        inputMode="numeric"
        required
        defaultValue={values.soonDays}
        hint="Ab hier steht eine Packung unter „Bald fällig“. Standard 90 Tage."
        error={errors.soonDays}
      />
      <Field
        label="Orange, dringend: Tage vor dem MHD"
        name="orange"
        inputMode="numeric"
        required
        defaultValue={values.urgentDays}
        hint="Mindestens 7 Tage und höchstens so viele wie bei Gelb. Standard 28 Tage."
        error={errors.urgentDays}
      />
      <LiveMessage message={errors.urgentDays ?? errors.soonDays} />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
