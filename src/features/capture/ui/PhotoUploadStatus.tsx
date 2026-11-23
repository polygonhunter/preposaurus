import { Button } from '@/shared/ui/Button'
import type { CapturedPhoto } from './photo-capture-state'

type PhotoUploadStatusProps = Readonly<{ photo: CapturedPhoto; onRetry: () => void }>

// Upload-Zustand eines Fotos (#61, UX §8.5 „Foto nicht hochgeladen: nochmal“).
export function PhotoUploadStatus({ photo, onRetry }: PhotoUploadStatusProps) {
  switch (photo.status) {
    case 'uploading':
      return <span className="text-fg2">lädt hoch …</span>
    case 'failed':
      return (
        <Button variant="plain" onClick={onRetry} className="text-footnote">
          nicht hochgeladen: nochmal
        </Button>
      )
    case 'rejected':
      return <span className="text-red">{photo.message}</span>
    case 'uploaded':
      return null
  }
}
