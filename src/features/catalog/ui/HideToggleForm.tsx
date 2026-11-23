import { FormSubmitButton } from '@/shared/ui/FormSubmitButton'

type HideToggleFormProps = Readonly<{
  id: string
  isHidden: boolean
  action: (formData: FormData) => Promise<void>
}>

// Aus- oder wieder einblenden (EIN-04). Ausgeblendetes steht in keiner Auswahl mehr, bleibt aber
// an den Produkten stehen und zählt weiter.
export function HideToggleForm({ id, isHidden, action }: HideToggleFormProps) {
  return (
    <form action={action} className="mx-4 flex breit:mx-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ausblenden" value={isHidden ? 'nein' : 'ja'} />
      <FormSubmitButton variant="tinted" pendingLabel="Speichert …">
        {isHidden ? 'Wieder einblenden' : 'Ausblenden'}
      </FormSubmitButton>
    </form>
  )
}
