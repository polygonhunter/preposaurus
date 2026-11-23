'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import { discardDraftAction } from '../actions/discard-draft-action'

type DraftResumePromptProps = Readonly<{
  draftId: string
  /** „von heute“, „von gestern“, „vom 21.11.“ */
  ageLabel: string
  photoCount: number
}>

const photos = (count: number) => (count === 1 ? '1 Foto' : `${String(count)} Fotos`)

// Offener Entwurf beim Öffnen von „Neu“ (UX §8.5): „Fortsetzen oder verwerfen?“. Fortsetzen ist
// der Normalfall, deshalb schließt auch Escape in Richtung Fortsetzen. Verwerfen löscht Entwurf
// und Entwurfsfotos, danach öffnet „Neu“ den gewohnten Weg.
export function DraftResumePrompt({ draftId, ageLabel, photoCount }: DraftResumePromptProps) {
  const router = useRouter()
  const [isDiscarding, setDiscarding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function discard() {
    setDiscarding(true)
    const result = await discardDraftAction({ entwurfId: draftId })
    setDiscarding(false)
    if (!result.ok) setMessage(result.message)
    router.refresh()
  }

  return (
    <Sheet
      isOpen
      onClose={() => {
        router.push('/neu/foto')
      }}
      title="Erfassung fortsetzen?"
      actions={
        <>
          <Button
            onClick={() => {
              router.push('/neu/foto')
            }}
          >
            Fortsetzen
          </Button>
          <Button
            variant="destructive"
            pendingLabel={isDiscarding ? 'Verwirft …' : undefined}
            onClick={() => void discard()}
          >
            Verwerfen
          </Button>
        </>
      }
    >
      <p>
        Eine Erfassung {ageLabel} ist noch offen
        {photoCount > 0 ? ` (${photos(photoCount)})` : ''}. Möchtest du sie fortsetzen oder
        verwerfen?
      </p>
      {message === null ? null : <p className="pt-2 text-footnote text-red">{message}</p>}
    </Sheet>
  )
}
