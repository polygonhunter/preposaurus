// Zustand der Formulare für eigene Kategorien und Lebensmittelarten (#76, #126): Fehler je Feld,
// eine Meldung und die abgeschickten Texte, damit nach einem Fehler nichts verloren geht.

export type EntryFormState<F extends string> = Readonly<{
  status: 'idle' | 'saved' | 'error'
  errors: Partial<Record<F, string>>
  message: string | null
  values: Readonly<Record<F, string>> | null
}>

export const entryFormIdle = <F extends string>(): EntryFormState<F> => ({
  status: 'idle',
  errors: {},
  message: null,
  values: null,
})

export function entryFormError<F extends string>(
  values: Readonly<Record<F, string>>,
  problem: Readonly<{ errors?: Partial<Record<F, string>>; message?: string }>,
): EntryFormState<F> {
  return { status: 'error', errors: problem.errors ?? {}, message: problem.message ?? null, values }
}

/** Liest die Felder eines Formulars als Texte, Name im Formular → Feld im Schema. */
export function readFields<F extends string>(
  formData: FormData,
  names: Readonly<Record<F, string>>,
): Record<F, string> {
  const entries = Object.entries(names).map(([field, name]) => {
    const value = formData.get(name as string)
    return [field, typeof value === 'string' ? value : '']
  })
  return Object.fromEntries(entries) as Record<F, string>
}
