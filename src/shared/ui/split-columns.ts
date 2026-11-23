// Falz-Regel an einer Stelle (DESIGN_SYSTEM §6, M12, #253): Ab „breit“ liegt die Spaltengrenze in der
// Fenstermitte, 24 px frei um die Mitte, damit auf dem Duo quer nichts Antippbares auf der Falz liegt
// (UX_KONZEPT §6). 228 px = Seitenleiste 216 px + halber Abstand 12 px. Ab „weit“ (PC, keine Falz)
// legt jede Seite ihre eigenen Spalten darüber.
export const FOLD_SPLIT_COLUMNS =
  'breit:grid breit:grid-cols-[calc(50vw-228px)_minmax(0,1fr)] breit:gap-x-6'

// Ein Element über beiden Spalten (Rand 24 px wie `breit:mx-6`), das trotzdem vor der Falz enden
// muss: 252 px = 228 px wie oben + Rand 24 px.
export const FOLD_LEFT_MAX_WIDTH = 'breit:max-w-[calc(50vw-252px)]'
