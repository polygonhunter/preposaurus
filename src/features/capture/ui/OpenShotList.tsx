import { useId } from 'react'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { OpenShotItem } from './OpenShotItem'
import type { PhotoCaptureState } from './photo-capture-state'
import type { PhotoEditor } from './use-photo-capture'

type OpenShotListProps = Readonly<{ state: PhotoCaptureState; editor: PhotoEditor }>

function focusDateField() {
  requestAnimationFrame(() => {
    document.getElementsByName('mhd')[0]?.focus()
  })
}

// „Noch zu klären“: MHD-Fotos, die noch eine Entscheidung brauchen (#65). Solange eines offen
// ist, sperrt es das Speichern.
export function OpenShotList({ state, editor }: OpenShotListProps) {
  const headerId = useId()
  if (state.shots.length === 0) return null
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>Noch zu klären</GroupHeader>
      <ul
        aria-labelledby={headerId}
        className="mx-4 divide-y divide-line overflow-hidden rounded-group bg-surface breit:mx-6 breit:border breit:border-line"
      >
        {state.shots.map((shot, index) => (
          <OpenShotItem
            key={shot.localId}
            shot={shot}
            number={index + 1}
            handlers={{
              resolve: (resolution) => {
                editor.resolveShot(shot.localId, resolution)
              },
              typeIn: () => {
                editor.resolveShot(shot.localId, 'typed')
                focusDateField()
              },
              readAgain:
                editor.readAgainShot === null
                  ? null
                  : () => {
                      editor.readAgainShot?.(shot.localId)
                    },
              estimate: () => {
                editor.estimate('mhd', shot.localId)
              },
            }}
          />
        ))}
      </ul>
    </section>
  )
}
