// Zwei Spalten ab „breit“ (DESIGN_SYSTEM §6, M12): Die Grenze liegt in der Fenstermitte, 24 px frei
// um die Mitte, damit auf dem Duo quer nichts Antippbares auf der Falz liegt (UX_KONZEPT §6).
// 228 px = Seitenleiste 216 px + halber Abstand 12 px. Ab „weit“ (PC, keine Falz) legt jede Seite
// ihre eigenen Spalten darüber.
export const FOLD_SPLIT_COLUMNS =
  'breit:grid breit:grid-cols-[calc(50vw-228px)_minmax(0,1fr)] breit:gap-x-6'
