import { redirect } from 'next/navigation'

// Der Erfassen-Knopf öffnet den zuletzt genutzten Weg (UX §8.5). Bis der Foto-Weg (M6) eine
// Oberfläche hat, ist das immer „Manuell“. Danach entscheidet hier die letzte Erfassung des Nutzers.
export default function CapturePage() {
  redirect('/neu/manuell')
}
