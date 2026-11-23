import { Button } from '@/shared/ui/Button'

type CameraNoticeProps = Readonly<{ text: string; onManual: () => void }>

// Erkennung aus (UX §8.5 „Erkennung aus oder nicht erreichbar“, #210): gleich zu Beginn in der
// Kamera, nicht erst nach drei Fotos. Fotografieren bleibt möglich, die Bilder gehören dann nur als
// Produktbild dazu. „Von Hand weiter“ führt ins Formular.
export function CameraNotice({ text, onManual }: CameraNoticeProps) {
  return (
    <div className="mx-4 mt-3 flex flex-col gap-2 rounded-group bg-surface px-4 py-3">
      <p role="status" className="text-footnote text-fg2">
        {text} Es wird nichts geraten, Fotos bleiben als Produktbild.
      </p>
      <span>
        <Button variant="tinted" onClick={onManual}>
          Von Hand weiter
        </Button>
      </span>
    </div>
  )
}
