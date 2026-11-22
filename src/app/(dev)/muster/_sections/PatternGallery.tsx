import { ActionsSection } from './ActionsSection'
import { BasicsSection } from './BasicsSection'
import { DataSection } from './DataSection'
import { InputSection } from './InputSection'
import { ListSection } from './ListSection'
import { OverlayDemo } from './OverlayDemo'

// Eine Spalte der Musterseite. Hell oder dunkel bestimmt die umgebende color-scheme.
export function PatternGallery() {
  return (
    <>
      <BasicsSection />
      <ActionsSection />
      <ListSection />
      <InputSection />
      <DataSection />
      <OverlayDemo />
    </>
  )
}
