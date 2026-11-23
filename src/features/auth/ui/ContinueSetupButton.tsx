import type { ButtonVariant } from '@/shared/ui/button-styles'
import { FormSubmitButton } from '@/shared/ui/FormSubmitButton'
import { continueSetupAction } from '../actions/continue-setup-action'
import type { SetupStep } from '../domain/setup-steps'

type ContinueSetupButtonProps = Readonly<{
  step: SetupStep
  label: string
  variant?: ButtonVariant | undefined
}>

// Ein Schritt der Einrichtung weiter, ohne etwas zu speichern (#40). Ein Formular statt eines
// Klicks per JavaScript, damit es auch vor dem Laden der Skripte geht.
export function ContinueSetupButton({ step, label, variant }: ContinueSetupButtonProps) {
  return (
    <form action={continueSetupAction} className="flex flex-col items-center">
      <input type="hidden" name="schritt" value={step} />
      <FormSubmitButton pendingLabel="Einen Moment …" variant={variant}>
        {label}
      </FormSubmitButton>
    </form>
  )
}
