import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

const FACTS = [
  {
    title: 'Fotos gehen an Anthropic',
    subtitle: 'Zur Erkennung, Anthropic ist ein Anbieter aus den USA.',
  },
  { title: 'Jedes Foto kostet etwas', subtitle: 'Einen kleinen Betrag, über euer Konto dort.' },
  { title: 'Nur Vorschläge', subtitle: 'Gespeichert wird erst, wenn ihr bestätigt.' },
] as const

// Was man vor dem Einschalten wissen sollte (#314): wohin die Fotos gehen und was es kostet.
export function RecognitionFacts() {
  return (
    <>
      <GroupHeader id="gut-zu-wissen">Gut zu wissen</GroupHeader>
      <Group labelledBy="gut-zu-wissen">
        {FACTS.map(({ title, subtitle }) => (
          <Row key={title} title={title} subtitle={subtitle} />
        ))}
      </Group>
    </>
  )
}
