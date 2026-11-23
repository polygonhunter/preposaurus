'use client'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'

type PasswordRevealProps = Readonly<{ username: string; password: string }>

// Passwort einmal zeigen (EINSTELLUNGEN_NUTZER §3.1, ONBOARDING §3.1): groß, gut abschreibbar, mit
// „Kopieren“. Es steht nur in der Antwort der Action und ist nach Verlassen der Seite weg.
export function PasswordReveal({ username, password }: PasswordRevealProps) {
  const [isCopied, setIsCopied] = useState(false)
  return (
    <section
      aria-labelledby="passwort-einmal"
      className="mx-4 flex flex-col gap-3 rounded-group bg-surface p-4 breit:mx-6 breit:border breit:border-line"
    >
      <h2 id="passwort-einmal" className="text-headline">
        Dieses Passwort wird nur jetzt angezeigt.
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-footnote text-fg2">Benutzername</dt>
        <dd className="text-body">{username}</dd>
        <dt className="text-footnote text-fg2">Passwort</dt>
        <dd className="text-title2 break-all select-all">{password}</dd>
      </dl>
      <p className="text-footnote text-fg2">
        Gib es am besten persönlich weiter. Gespeichert ist es nur als verschlüsselter Wert.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="tinted"
          onClick={() => {
            void navigator.clipboard.writeText(password).then(() => {
              setIsCopied(true)
            })
          }}
        >
          Kopieren
        </Button>
        <p aria-live="polite" className="text-footnote text-green">
          {isCopied ? 'Kopiert.' : ''}
        </p>
      </div>
    </section>
  )
}
