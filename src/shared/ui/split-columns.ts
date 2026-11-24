// Spalten ab „breit“ an einer Stelle (DESIGN_SYSTEM §6, #253).
//
// Ohne Falz (PC-Fenster): Liste bzw. linke Spalte fest 340 px, das Detail bekommt den Rest. Keine
// Bindung an die Fenstermitte, so bleibt die Liste auch bei 900 px gut lesbar.
//
// Mit Falz (`falz:`, Viewport Segments, globals.css): Die linke Spalte endet vor der Falz, die Falz
// ist die Fuge, die rechte Spalte füllt den rechten Bildschirm. Die Seitenleiste steht davor, deshalb
// zieht die linke Spalte ihre Breite ab. Der Rahmen erkennt diese Seiten am Attribut
// `data-falz-spalten` und rückt sie nicht auf den rechten Bildschirm (AppFrame).
const FOLD_COLUMNS =
  'falz:grid-cols-[calc(var(--falz-anfang)-var(--seitenleiste))_minmax(0,1fr)] falz:gap-x-[calc(var(--falz-ende)-var(--falz-anfang))]'

export const SPLIT_COLUMNS = `breit:grid breit:grid-cols-[340px_minmax(0,1fr)] breit:gap-x-6 ${FOLD_COLUMNS}`

// Zwei gleich breite Spalten ohne Falz (Formular beim Erfassen), mit Falz wie oben
export const EVEN_SPLIT_COLUMNS = `breit:grid breit:grid-cols-2 breit:gap-x-6 ${FOLD_COLUMNS}`

// Attribut, an dem der Rahmen eine Seite mit Falz-Spalten erkennt
export const FOLD_SPLIT_MARKER = { 'data-falz-spalten': '' } as const

// Ein Element über beiden Spalten, das auf einer Seite mit Falz-Spalten trotzdem vor der Falz enden
// muss (24 px Rand wie `breit:mx-6` zusätzlich). Auf einer einspaltigen Seite steht es ohnehin rechts.
export const FOLD_LEFT_MAX_WIDTH =
  'falz:[main:has([data-falz-spalten])_&]:max-w-[calc(var(--falz-anfang)-var(--seitenleiste)-24px)]'
