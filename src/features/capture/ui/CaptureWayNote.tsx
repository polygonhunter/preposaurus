import { FOLD_LEFT_MAX_WIDTH } from '@/shared/ui/split-columns'
import { cx } from '@/shared/lib/class-names'

type CaptureWayNoteProps = Readonly<{ text: string }>

// „Neu“ öffnet bei ausgeschalteter Foto-Erkennung das Formular statt der gewohnten Kamera (#79).
// Ein ruhiger Satz unter dem Umschalter sagt, warum; derselbe Satz wie in der Kamera (#210).
export function CaptureWayNote({ text }: CaptureWayNoteProps) {
  return (
    <p
      role="status"
      className={cx('mx-4 px-4 pt-3 text-footnote text-fg2 breit:mx-6', FOLD_LEFT_MAX_WIDTH)}
    >
      {text}
    </p>
  )
}
