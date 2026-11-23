// Erzeugt das App-Icon (M10-01, #81) aus einer einzigen Zeichnung: drei gestapelte Vorratskisten
// in Weiß auf dem Akzent-Blau (DESIGN_SYSTEM §3), Linienstil wie die Piktogramme (§5 Icon).
// Aufruf nach einer Änderung an der Zeichnung: npm run icons. Die Dateien sind eingecheckt, der
// Build braucht das Skript nicht.
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const ACCENT = '#0060CC'
const SIZE = 512
// Ecken für „any“. iOS (apple-icon) und „maskable“ schneiden selbst zu und bekommen volle Fläche.
const CORNER_RADIUS = 112
// Maskable: Inhalt muss im Kreis mit 40 % Radius liegen (W3C Manifest, „safe zone“).
const MASKABLE_SCALE = 0.84

const BOX_WIDTH = 124
const BOX_HEIGHT = 112

const box = (x: number, y: number) =>
  `<rect x="${String(x)}" y="${String(y)}" width="${String(BOX_WIDTH)}" height="${String(BOX_HEIGHT)}" rx="14"/>` +
  `<path d="M${String(x)} ${String(y + 38)}h${String(BOX_WIDTH)}M${String(x + 44)} ${String(y + 68)}h36"/>`

const MOTIF =
  `<g fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">` +
  `${box(194, 126)}${box(110, 274)}${box(278, 274)}</g>`

type IconVariant = Readonly<{ rounded: boolean; scale: number }>

function iconSvg({ rounded, scale }: IconVariant): string {
  const radius = rounded ? CORNER_RADIUS : 0
  const offset = (SIZE * (1 - scale)) / 2
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}">`,
    `<rect width="${String(SIZE)}" height="${String(SIZE)}" rx="${String(radius)}" fill="${ACCENT}"/>`,
    `<g transform="translate(${String(offset)} ${String(offset)}) scale(${String(scale)})">${MOTIF}</g>`,
    '</svg>\n',
  ].join('')
}

async function writePng(svg: string, size: number, path: string): Promise<void> {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(path)
}

const anySvg = iconSvg({ rounded: true, scale: 1 })
const fullBleedSvg = iconSvg({ rounded: false, scale: 1 })
const maskableSvg = iconSvg({ rounded: false, scale: MASKABLE_SCALE })

mkdirSync('public/icons', { recursive: true })
writeFileSync('src/app/icon.svg', anySvg)
await writePng(fullBleedSvg, 180, 'src/app/apple-icon.png')
await writePng(anySvg, 192, 'public/icons/icon-192.png')
await writePng(anySvg, 512, 'public/icons/icon-512.png')
await writePng(maskableSvg, 512, 'public/icons/icon-maskable-512.png')
