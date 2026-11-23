import { useId } from 'react'
import type { PhotoRole } from '@/shared/config/constants'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { CapturedPhoto } from './photo-capture-state'
import { PhotoUploadStatus } from './PhotoUploadStatus'

type PhotoStripProps = Readonly<{
  photos: readonly CapturedPhoto[]
  onRetry: (localId: string) => void
}>

const ROLE_LABELS: Record<PhotoRole, string> = {
  verpackung: 'Verpackung',
  naehrwerte: 'Nährwerte',
  mhd: 'MHD',
}

// Aufgenommene Fotos mit Upload-Zustand (#61). Ein gescheiterter Upload bleibt im Gerät und lässt
// sich neu senden. Fotos sind nie Pflicht, alles geht auch ohne sie.
export function PhotoStrip({ photos, onRetry }: PhotoStripProps) {
  const headerId = useId()
  if (photos.length === 0) return null
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>Fotos</GroupHeader>
      <ul className="flex flex-wrap gap-3 px-4 breit:px-6">
        {photos.map((photo, index) => (
          <li key={photo.localId} className="flex w-24 shrink-0 flex-col gap-1 text-footnote">
            {photo.previewUrl === null ? null : (
              // eslint-disable-next-line @next/next/no-img-element -- weil blob:-Adressen kein next/image erlauben
              <img
                src={photo.previewUrl}
                alt={`Foto ${String(index + 1)}: ${ROLE_LABELS[photo.role]}`}
                className="aspect-square w-24 rounded-group bg-fill object-cover"
              />
            )}
            <span>{ROLE_LABELS[photo.role]}</span>
            <PhotoUploadStatus
              photo={photo}
              onRetry={() => {
                onRetry(photo.localId)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
