import { Button } from '@/shared/ui/Button'
import { signOutAction } from '../actions/sign-out-action'

// Abmelden unter Konto und Gerät (EINSTELLUNGEN_NUTZER §4.2). Ein Formular statt eines Klicks per
// JavaScript, damit es auch vor dem Laden der Skripte geht.
export function SignOutButton() {
  return (
    <form
      action={signOutAction}
      className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line"
    >
      <Button type="submit" variant="plain" className="w-full justify-start">
        Abmelden
      </Button>
    </form>
  )
}
