// Zustand des Blatts „Neuer Lagerort“ (#301): Name und Antwort der Action. Den Namen prüft schon das
// Gerät mit demselben Schema wie der Server, damit ein leeres Feld ohne Umweg eine Antwort bekommt.
// Die Dublette prüft der Server (ohne Groß- und Kleinschreibung) und liefert den vorhandenen Ort.
import { useState, useTransition } from 'react'
import { z } from 'zod'
import { catalogNameSchema } from '@/features/catalog/schemas'
import {
  addStorageLocationFromCaptureAction,
  type AddStorageLocationOutcome,
} from '../actions/add-storage-location-action'

type AddStorageLocationProblem = Extract<AddStorageLocationOutcome, { ok: false }>
export type AddedLocation = Extract<AddStorageLocationOutcome, { ok: true }>

export function useNewStorageLocation(onAdded: (added: AddedLocation) => void) {
  const [name, setName] = useState('')
  const [problem, setProblem] = useState<AddStorageLocationProblem | null>(null)
  const [isPending, startTransition] = useTransition()

  function change(nextName: string) {
    setName(nextName)
    setProblem(null)
  }

  function create() {
    if (isPending) return
    const parsed = catalogNameSchema.safeParse(name)
    if (!parsed.success) {
      const [nameError] = z.flattenError(parsed.error).formErrors
      setProblem({ ok: false, nameError: nameError ?? null, message: null })
      return
    }
    startTransition(async () => {
      const outcome = await addStorageLocationFromCaptureAction({ name })
      if (outcome.ok) onAdded(outcome)
      else setProblem(outcome)
    })
  }

  return { name, change, create, problem, isPending }
}
